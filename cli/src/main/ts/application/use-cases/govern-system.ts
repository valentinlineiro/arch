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
    const starvationCycles = config.governance?.starvationCycles ?? 5;

    // 0. Batch Drain
    await this.batchSystem.drain();

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

    // 4. Rule 5 — Starvation detection
    // This is complex as it requires tracking conduct cycles. 
    // Simplified: check git log for how many [THINK] commits appeared since task became READY.
    // For now, let's implement the basic flow and refine starvation if needed.

    // 5. Pick next task if none focused
    const allTasks = await this.taskRepository.getAll();
    const focusedTask = allTasks.find(t => t.rawMetaLine?.includes('Focus:yes') && t.status !== TaskStatus.DONE);
    
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
}
