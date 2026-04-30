import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { spawn } from 'node:child_process';
import { SelectNextTask } from './select-next-task.js';

export interface LoopOptions {
  sprint?: string;
  dryRun?: boolean;
  resume?: boolean;
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

  async execute(options: LoopOptions): Promise<void> {
    if (options.resume) {
      await this.handleResume(options);
      return;
    }

    const scopeLabel = options.sprint ? ` [sprint: ${options.sprint}]` : '';
    console.log(`\n[LOOP] Starting arch loop${options.dryRun ? ' (dry-run)' : ''}${scopeLabel}`);

    while (true) {
      // 1. GOVERN — select next task, handle replenishment
      console.log('\n[LOOP] Phase: GOVERN');
      if (!options.dryRun) {
        const code = await this.sh('govern');
        if (code !== 0) {
          console.error('[LOOP] arch govern failed. Halting.');
          process.exit(code);
        }
      } else {
        console.log('[dry-run] Would run: arch govern');
      }

      // 2. SELECT — find next unblocked task, applying sprint filter
      const selector = new SelectNextTask(this.taskRepository);
      const task = await selector.execute();

      if (!task) {
        console.log('[LOOP] No unblocked READY tasks. Loop complete.');
        break;
      }

      // Sprint scope: skip tasks outside the requested sprint
      if (options.sprint) {
        const sprintValue = task.sprint ?? '';
        const normalised = options.sprint.startsWith('sprint/') ? options.sprint : `sprint/${options.sprint}`;
        if (sprintValue !== normalised && sprintValue !== options.sprint) {
          console.log(`[LOOP] Next task ${task.id} is outside sprint ${options.sprint}. No matching tasks remain.`);
          break;
        }
      }

      console.log(`[LOOP] Selected: ${task.id} — ${task.title} (${task.priority} | ${task.size})`);

      if (options.dryRun) {
        console.log(`[dry-run] Would execute cycle for ${task.id}`);
        break;
      }

      const cycleStart = Date.now();

      // 3. EXEC — delegate to arch exec (arch.sh invokes the AI CLI with DO.md)
      console.log(`\n[LOOP] Phase: EXEC (${task.id})`);
      const execCode = await this.sh('exec');
      if (execCode !== 0) {
        await this.appendInbox(task.id, 'ANDON_HALT', `arch exec exited with code ${execCode}`);
        console.error(`[LOOP] Exec failed for ${task.id}. INBOX updated. Halting.`);
        process.exit(1);
      }

      // 4. REVIEW — deterministic check; track consecutive failures per task
      console.log(`\n[LOOP] Phase: REVIEW (${task.id})`);
      const reviewCode = await this.sh('review');

      if (reviewCode !== 0) {
        const failures = (this.reviewFailures.get(task.id) ?? 0) + 1;
        this.reviewFailures.set(task.id, failures);
        console.warn(`[LOOP] Review failed for ${task.id} (${failures}/${ANDON_MAX_FAILURES}).`);

        if (failures >= ANDON_MAX_FAILURES) {
          await this.appendInbox(task.id, 'ANDON_HALT', `arch review failed ${failures} consecutive times. Write APPROVE or REDIRECT in INBOX then run arch loop --resume.`);
          console.error(`[LOOP] Andon Cord: ${task.id} halted after ${failures} review failures.`);
          process.exit(1);
        }

        console.log(`[LOOP] Retrying ${task.id} (${ANDON_MAX_FAILURES - failures} attempt(s) remaining).`);
        continue;
      }

      this.reviewFailures.delete(task.id);

      // 5. ARCHIVE — mark done, move to archive, commit (arch task done runs arch govern after)
      console.log(`\n[LOOP] Phase: ARCHIVE (${task.id})`);
      const archiveCode = await this.sh('task', 'done', task.id);
      if (archiveCode !== 0) {
        console.error(`[LOOP] Archive failed for ${task.id}. Halting.`);
        process.exit(1);
      }

      const elapsed = Math.round((Date.now() - cycleStart) / 1000);
      console.log(`[LOOP] ✓ ${task.id} done in ${elapsed}s.`);
    }

    console.log('\n[LOOP] Done.');
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

  private sh(...args: string[]): Promise<number> {
    return new Promise((resolve) => {
      const child = spawn(ARCH_SH, args, { stdio: 'inherit', cwd: process.cwd() });
      child.on('close', (code) => resolve(code ?? 0));
    });
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
