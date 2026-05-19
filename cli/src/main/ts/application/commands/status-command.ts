import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class StatusCommand {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private rootPath: string = '.',
  ) {}

  async execute(): Promise<void> {
    const tasks = await this.taskRepository.getAll();

    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
    const review = tasks.filter(t => t.status === 'REVIEW');
    const ready = tasks.filter(t => t.status === 'READY');

    fmt.header('Session Status');

    // Current work
    if (inProgress.length > 0) {
      console.log('  IN_PROGRESS:');
      for (const t of inProgress) {
        console.log(`    ${t.id}  ${t.priority} ${t.size}  ${t.title}`);
      }
    } else {
      console.log('  IN_PROGRESS: (none)');
    }

    // Needs audit
    if (review.length > 0) {
      console.log(`\n  REVIEW (needs audit):`);
      for (const t of review) {
        console.log(`    ${t.id}  ${t.priority} ${t.size}  ${t.title}`);
      }
    }

    // Next actionable task
    const nextTask = ready
      .filter(t => !this.isBlocked(t, tasks))
      .sort((a, b) => this.priorityScore(a) - this.priorityScore(b))[0];

    if (nextTask) {
      console.log(`\n  NEXT:  ${nextTask.id}  ${nextTask.priority} ${nextTask.size}  ${nextTask.title}`);
      console.log(`         arch task start ${nextTask.id}`);
    }

    // Backlog summary
    const unblocked = ready.filter(t => !this.isBlocked(t, tasks));
    const blocked = ready.filter(t => this.isBlocked(t, tasks));
    console.log(`\n  Backlog: ${unblocked.length} actionable, ${blocked.length} blocked`);

    // INBOX alerts
    try {
      const inbox = await this.fileSystem.readFile(`${this.rootPath}/docs/INBOX.md`);
      const alerts = inbox.split('\n').filter(l =>
        l.includes('PATTERN-ALERT') || l.includes('ANDON_HALT') || l.includes('CORPUS_ALERT')
      );
      if (alerts.length > 0) {
        console.log(`\n  \x1b[33m⚠\x1b[0m  Alerts (${alerts.length}):`);
        for (const a of alerts.slice(0, 3)) {
          console.log(`    ${a.trim().slice(0, 80)}`);
        }
      }
    } catch { /* no inbox */ }

    // Last report integrity
    try {
      const metrics = await this.fileSystem.readFile(`${this.rootPath}/docs/METRICS.md`);
      const integrity = metrics.match(/\*\*Integrity Level\*\*\s*\|\s*(\S+)/)?.[1];
      if (integrity && integrity !== 'N/A') {
        const icon = integrity === 'HIGH' ? '✔' : integrity === 'LOW' ? '⚠' : '~';
        console.log(`\n  Report: ${icon} Integrity ${integrity}`);
      }
    } catch { /* no metrics */ }

    console.log('');
  }

  private isBlocked(task: any, all: any[]): boolean {
    const deps: string[] = Array.isArray(task.depends) ? task.depends : [];
    if (deps.length === 0 || (deps.length === 1 && deps[0] === 'none')) return false;
    return deps.some((dep: string) => {
      const depTask = all.find((t: any) => t.id === dep);
      return depTask && depTask.status !== 'DONE';
    });
  }

  private priorityScore(task: any): number {
    const p: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
    const s: Record<string, number> = { XS: 0, S: 1, M: 2, L: 3 };
    return (p[task.priority ?? 'P3'] ?? 3) * 10 + (s[task.size ?? 'S'] ?? 1);
  }
}
