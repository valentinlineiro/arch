import { SelectNextTask, MuriConfig } from '../use-cases/select-next-task.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';

const STALE_INBOX_HOURS = 24;

export class NextCommand {
  private useCase: SelectNextTask;

  constructor(
    private taskRepository: TaskRepository,
    private args: string[] = [],
    muriConfig?: MuriConfig,
    private fileSystem?: FileSystem,
    private rootPath?: string,
  ) {
    this.useCase = new SelectNextTask(taskRepository, muriConfig);
  }

  async execute(): Promise<void> {
    // Stale INBOX check — fail-closed if INBOX is outdated
    if (this.fileSystem && this.rootPath) {
      await this.checkInboxFreshness();
    }

    const result = await this.useCase.execute();

    if (!result.ok) {
      const { halt } = result;
      let reason: string;
      if (halt.kind === 'no_ready_tasks') {
        reason = 'No READY tasks available.';
      } else if (halt.kind === 'stale_lock') {
        reason = `Stale lock: ${halt.taskId} has been IN_PROGRESS since ${halt.lockedAt} (> 3 days). Resolve before proceeding.`;
      } else if (halt.kind === 'budget_exceeded') {
        reason = `HALT: ${halt.taskId} has exceeded its ${halt.type} budget (${halt.current} > ${halt.limit}). Escalate before continuing.`;
      } else {
        reason = `Highest-priority READY task ${halt.taskId} is blocked by unresolved dependencies: ${halt.blockedBy.join(', ')}.`;
      }
      process.stderr.write(reason + '\n');
      process.exit(1);
    }

    const task = result.task;

    // --verify: run pre-flight AC check before returning task
    if (this.args.includes('--verify') && task.content) {
      const { DeterministicACVerifier } = await import('../../domain/services/deterministic-ac-verifier.js');
      const verifier = new DeterministicACVerifier(this.rootPath ?? '.');
      const verResult = await verifier.verify(task);
      const hasVerifiable = verResult.evidence.some(e => e.type === 'cmd' || e.type === 'file');
      if (verResult.pass && hasVerifiable) {
        process.stderr.write(
          `[PRE-IMPL] ${task.id} — all predicates already pass. Verify this task is not pre-implemented before starting.\n`
        );
      }
    }

    if (this.args.includes('--json')) {
      console.log(JSON.stringify({ taskId: task.id, filePath: task.filePath, content: task.content }));
    } else {
      console.log(task.content);
    }
  }

  private async checkInboxFreshness(): Promise<void> {
    try {
      const inboxPath = `${this.rootPath}/docs/INBOX.md`;
      const content = await this.fileSystem!.readFile(inboxPath);

      // Look for a timestamp comment: <!-- generated: ISO8601 --> or **Generated:** date
      const tsMatch = content.match(/<!--\s*generated:\s*([\d-T:.Z]+)\s*-->/) ||
                      content.match(/\*\*Generated:\*\*\s*([\d-T:.Z]+)/) ||
                      content.match(/<!-- arch-inbox:\s*([\d-T:.Z]+)\s*-->/);

      if (!tsMatch) return; // No timestamp — can't check; pass through

      const generatedAt = new Date(tsMatch[1]);
      const ageMs = Date.now() - generatedAt.getTime();
      const ageHours = ageMs / (1000 * 60 * 60);

      if (ageHours > STALE_INBOX_HOURS) {
        const reason = `HALT: INBOX is stale (last regenerated ${Math.floor(ageHours)}h ago, limit ${STALE_INBOX_HOURS}h). Run arch reflect to regenerate before selecting a task.`;
        process.stderr.write(reason + '\n');
        process.exit(1);
      }
    } catch {
      // INBOX missing or unreadable — pass through, let other checks handle it
    }
  }
}
