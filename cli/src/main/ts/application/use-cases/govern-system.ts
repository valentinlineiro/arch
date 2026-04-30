import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { Task, TaskStatus } from '../../domain/models/task.js';
import { SelectNextTask } from './select-next-task.js';
import { BatchSystem } from './batch-system.js';
import { spawnSync } from 'node:child_process';

export class GovernSystem {
  private batchSystem: BatchSystem;

  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem
  ) {
    this.batchSystem = new BatchSystem(fileSystem);
  }

  async execute(): Promise<void> {
    const config = JSON.parse(await this.fileSystem.readFile('arch.config.json'));
    const conductEveryN = config.governance?.conductEveryN ?? 3;

    // 0. Batch Drain
    await this.batchSystem.drain();

    // 0.1 Archival Guard — Auto-archive DONE/REJECTED tasks from tasksDir
    await this.archiveDoneTasks();

    // 1. Rule 2 — Replenishment
    const readyTasks = await this.taskRepository.findReady();
    if (readyTasks.length < 3) {
      console.log('  READY tasks < 3. Running arch conduct...');
      await this.runConduct();
      return;
    }

    // 2. Rule 3 — Conduct cadence
    const execCount = await this.getExecCountSinceLastThink();
    if (execCount >= conductEveryN) {
      console.log(`  Exec count (${execCount}) >= N (${conductEveryN}). Running arch conduct...`);
      await this.runConduct();
      return;
    }

    // 3. Rule 1 — Critical first
    const p0Tasks = readyTasks.filter(t => t.priority === 'P0');
    if (p0Tasks.length > 0) {
      // Find unblocked P0
      const selector = new SelectNextTask(this.taskRepository);
      const nextTask = await selector.execute();
      if (nextTask && nextTask.priority === 'P0') {
         console.log(`  P0 task READY: ${nextTask.id}. Focusing...`);
         await this.focusTask(nextTask);
         return;
      }
    }

    // 4. Pick next task if none focused
    const activeTasksForFocus = await this.taskRepository.getActive();
    const focusedTask = activeTasksForFocus.find(t => t.rawMetaLine?.includes('Focus:yes') && t.status !== TaskStatus.DONE);

    if (!focusedTask) {

      const selector = new SelectNextTask(this.taskRepository);
      const nextTask = await selector.execute();
      if (nextTask) {
        console.log(`  No focused task. Picking next: ${nextTask.id}`);
        await this.focusTask(nextTask);
      } else {
        console.log('  No unblocked tasks available.');
      }
    } else {
      console.log(`  Task already focused: ${focusedTask.id}. Run arch exec to start.`);
    }
  }

  private async runConduct(): Promise<void> {
    spawnSync('./scripts/arch.sh', ['conduct'], { stdio: 'inherit' });
  }

  private async getExecCountSinceLastThink(): Promise<number> {
    // Commits with [TASK-XXX] since last commit with [THINK]
    const log = await this.gitRepository.getLog(100);
    let count = 0;
    for (const msg of log) {
      if (msg.includes('[THINK]')) break;
      if (/\[TASK-\d{3}\]/.test(msg)) count++;
    }
    return count;
  }

  private async focusTask(task: Task): Promise<void> {
    if (!task.rawMetaLine) return;
    const filePath = `docs/tasks/${task.id}.md`;
    const original = await this.fileSystem.readFile(filePath);
    const updated = original.replace(task.rawMetaLine, task.rawMetaLine.replace('Focus:no', 'Focus:yes'));
    await this.fileSystem.writeFile(filePath, updated);
    try {
      await this.gitRepository.add(filePath);
      await this.gitRepository.commit(`chore: [${task.id}] focus task via arch govern`);
      console.log(`  Focused and committed: ${task.id}`);
    } catch (error: any) {
      await this.fileSystem.writeFile(filePath, original);
      throw new Error(`Failed to commit focus for ${task.id}: ${error.message}`);
    }
  }

  private async archiveDoneTasks(): Promise<void> {
    // 1. Check for tasks in docs/tasks/ that are DONE/REJECTED
    const activeTasks = await this.taskRepository.getActive();
    const toArchive = activeTasks.filter(t => t.status === TaskStatus.DONE || t.status === TaskStatus.REJECTED);

    for (const task of toArchive) {
      await this.archiveFile(task.id);
    }

    // 2. Check for "phantom archives" — files already in docs/archive/ but not staged/committed in git
    const statusLines = await this.gitRepository.getStatusLines();
    const phantomIds = new Set<string>();
    
    for (const line of statusLines) {
      const match = line.match(/(D docs\/tasks\/|\?\? docs\/archive\/)(TASK-\d{3})\.md/);
      if (match) {
        phantomIds.add(match[2]);
      }
    }

    for (const id of phantomIds) {
      console.log(`  Syncing phantom archive ${id}...`);
      await this.archiveFile(id);
    }
  }

  private async archiveFile(taskId: string): Promise<void> {
    const sourcePath = `docs/tasks/${taskId}.md`;
    const targetPath = `docs/archive/${taskId}.md`;
    
    try {
      if (await this.fileSystem.exists(sourcePath)) {
        console.log(`  Auto-archiving ${taskId}...`);
        await this.gitRepository.mv(sourcePath, targetPath);
      } else if (await this.fileSystem.exists(targetPath)) {
        await this.gitRepository.add(targetPath);
        const status = await this.gitRepository.getStatusLines();
        if (status.some(l => l.includes(`D docs/tasks/${taskId}.md`))) {
          await this.gitRepository.rm(sourcePath);
        }
      } else {
        return;
      }
      
      await this.gitRepository.commit(`chore: archive [${taskId}] DONE [${taskId}] [THINK]`);
      console.log(`  ✓ ${taskId} archived and committed.`);
    } catch (error: any) {
      console.error(`  ✖ Failed to archive ${taskId}: ${error.message}`);
    }
  }
}
