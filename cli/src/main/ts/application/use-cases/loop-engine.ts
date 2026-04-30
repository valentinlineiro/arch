import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { TaskStatus } from '../../domain/models/task.js';
import { SelectNextTask } from './select-next-task.js';
import { SubprocessRunner } from '../../infrastructure/cli/subprocess-runner.js';

export interface LoopOptions {
  sprint?: string;
  dryRun?: boolean;
  resume?: boolean;
  verbose?: boolean;
}

const ANDON_MAX_FAILURES = 3;
const ARCH_SH = './scripts/arch.sh';

export class LoopEngine {
  private reviewFailures = new Map<string, number>();

  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem
  ) {}

  private log(message: string) {
    const ts = new Date().toISOString().slice(11, 19);
    console.log(`[${ts}] ${message}`);
  }

  async execute(options: LoopOptions): Promise<void> {
    if (options.resume) {
      await this.handleResume(options);
      return;
    }

    const scopeLabel = options.sprint ? ` [sprint: ${options.sprint}]` : '';
    this.log(`[LOOP] Starting arch loop${options.dryRun ? ' (dry-run)' : ''}${scopeLabel}`);

    while (true) {
      // 1. GOVERN — select next task, handle replenishment (skip AI conduct when in loop)
      this.log('[LOOP] Phase: GOVERN');
      if (!options.dryRun) {
        const code = await SubprocessRunner.run(ARCH_SH, ['govern', '--no-conduct'], { verbose: options.verbose });
        if (code !== 0) {
          console.error('[LOOP] arch govern failed. Halting.');
          process.exit(code);
        }
      } else {
        this.log('[dry-run] Would run: arch govern --no-conduct');
      }

      // 2. SELECT — prioritize focused task, otherwise find next unblocked task
      this.log('[LOOP] Phase: SELECT');
      const activeTasks = await this.taskRepository.getActive();
      let task = activeTasks.find(t => t.focus && (t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.READY || t.status === TaskStatus.REVIEW));

      if (!task) {
        const selector = new SelectNextTask(this.taskRepository);
        task = await selector.execute();
      }

      if (!task) {
        this.log('[LOOP] No unblocked READY tasks. Loop complete.');
        break;
      }

      // Sprint scope: skip tasks outside the requested sprint
      if (options.sprint) {
        const sprintValue = task.sprint ?? '';
        const normalised = options.sprint.startsWith('sprint/') ? options.sprint : `sprint/${options.sprint}`;
        if (sprintValue !== normalised && sprintValue !== options.sprint) {
          this.log(`[LOOP] Next task ${task.id} is outside sprint ${options.sprint}. No matching tasks remain.`);
          break;
        }
      }

      this.log(`[LOOP] Selected: ${task.id} — ${task.title} (${task.priority} | ${task.size})`);

      if (options.dryRun) {
        this.log(`[dry-run] Would execute cycle for ${task.id}`);
        break;
      }

      const cycleStart = Date.now();

      // 3. EXEC — delegate to arch exec (arch.sh invokes the AI CLI with DO.md)
      this.log(`[LOOP] Phase: EXEC (${task.id})`);
      
      const { code: execCode, stdout, stderr } = await SubprocessRunner.runWithOutput(ARCH_SH, ['exec'], { 
        stream: true // New option to stream in real-time
      });
      
      if (execCode !== 0) {
        await this.appendInbox(task.id, 'ANDON_HALT', `arch exec exited with code ${execCode}`);
        console.error(`[LOOP] Exec failed for ${task.id}. INBOX updated. Halting.`);
        process.exit(1);
      }

      // Capture summary from stdout (e.g., "Turns: 5", "Cost: $0.05")
      const turnMatch = stdout.match(/Turns: (\d+)/);
      const costMatch = stdout.match(/Cost: (\$\d+\.\d+)/);
      if (turnMatch || costMatch) {
        const summary = [
          turnMatch ? `${turnMatch[1]} turns` : '',
          costMatch ? `cost ${costMatch[1]}` : ''
        ].filter(Boolean).join(', ');
        this.log(`[LOOP] Agent activity: ${summary}`);
      }

      // 4. REVIEW — deterministic check; track consecutive failures per task
      this.log(`[LOOP] Phase: REVIEW (${task.id})`);
      const reviewCode = await SubprocessRunner.run(ARCH_SH, ['review'], { verbose: options.verbose });

      if (reviewCode !== 0) {
        const failures = (this.reviewFailures.get(task.id) ?? 0) + 1;
        this.reviewFailures.set(task.id, failures);
        console.warn(`[LOOP] Review failed for ${task.id} (${failures}/${ANDON_MAX_FAILURES}).`);

        if (failures >= ANDON_MAX_FAILURES) {
          await this.appendInbox(task.id, 'ANDON_HALT', `arch review failed ${failures} consecutive times. Write APPROVE or REDIRECT in INBOX then run arch loop --resume.`);
          console.error(`[LOOP] Andon Cord: ${task.id} halted after ${failures} review failures.`);
          process.exit(1);
        }

        this.log(`[LOOP] Retrying ${task.id} (${ANDON_MAX_FAILURES - failures} attempt(s) remaining).`);
        continue;
      }

      this.reviewFailures.delete(task.id);

      // 5. ARCHIVE — mark done, move to archive, commit (arch task done runs arch govern after)
      this.log(`[LOOP] Phase: ARCHIVE (${task.id})`);
      const archiveCode = await SubprocessRunner.run(ARCH_SH, ['task', 'done', task.id], { verbose: options.verbose });
      if (archiveCode !== 0) {
        console.error(`[LOOP] Archive failed for ${task.id}. Halting.`);
        process.exit(1);
      }

      const elapsed = Math.round((Date.now() - cycleStart) / 1000);
      this.log(`[LOOP] ✓ ${task.id} done in ${elapsed}s.`);
    }

    this.log('[LOOP] Done.');
  }

  private async handleResume(options: LoopOptions): Promise<void> {
    const inboxPath = 'docs/INBOX.md';
    let inbox = '';
    try {
      inbox = await this.fileSystem.readFile(inboxPath);
    } catch {
      console.log('[LOOP] No INBOX.md found. Starting fresh.');
      await this.execute({ ...options, resume: false });
      return;
    }

    const halts = [...inbox.matchAll(/^## \[.*?\] (ANDON_HALT|AWAITING_\w+) \| (TASK-\d{3})/gm)];
    if (halts.length === 0) {
      console.log('[LOOP] No pending halt conditions in INBOX. Resuming loop...');
      await this.execute({ ...options, resume: false });
      return;
    }

    console.log('[LOOP] Pending INBOX items (resolve before resuming):');
    for (const m of halts) {
      console.log(`  ${m[1]}: ${m[2]}`);
    }
    console.log('\n  Write APPROVE or REDIRECT: <instruction> inline in INBOX, then run arch loop --resume.');
  }

  private async appendInbox(taskId: string, type: string, evidence: string): Promise<void> {
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const entry = `\n## [${ts}] ${type} | ${taskId}\nEvidence: ${evidence}\n`;
    const inboxPath = 'docs/INBOX.md';
    let existing = '';
    try { existing = await this.fileSystem.readFile(inboxPath); } catch {}
    await this.fileSystem.writeFile(inboxPath, existing + entry);
  }
}
