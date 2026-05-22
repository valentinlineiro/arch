import { Command } from '../../domain/models/command.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { StatusReportService } from '../../domain/services/status-report-service.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class StatusCommand implements Command {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private rootPath: string = '.',
  ) {}

  async execute(args: string[] = []): Promise<void> {
    if (args.includes('--publish')) {
      await this.publishReport();
      return;
    }

    const tasks = await this.taskRepository.getAll();

    fmt.header('Session Status');

    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
    const review = tasks.filter(t => t.status === 'REVIEW');
    const ready = tasks.filter(t => t.status === 'READY');

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

    // Alignment score — only if ADRs exist and a cached score is available
    try {
      const adrDir = `${this.rootPath}/docs/adr`;
      const adrFiles = await this.fileSystem.readDirectory(adrDir);
      const adrCount = adrFiles.filter(f => f.endsWith('.md') && !f.includes('template')).length;

      if (adrCount > 0) {
        // Try to read last audit score from .arch/last-audit.json
        try {
          const auditCache = await this.fileSystem.readFile(`${this.rootPath}/.arch/last-audit.json`);
          const { score, timestamp, emergentCount } = JSON.parse(auditCache);
          const age = Math.round((Date.now() - new Date(timestamp).getTime()) / 3600000);
          const icon = score >= 80 ? '\x1b[32m✔\x1b[0m' : score >= 60 ? '\x1b[33m⚠\x1b[0m' : '\x1b[31m✖\x1b[0m';
          const ageStr = age < 1 ? 'just now' : age < 24 ? `${age}h ago` : `${Math.round(age / 24)}d ago`;
          const emergentStr = emergentCount > 0 ? `  ${emergentCount} emergent` : '';
          console.log(`  Audit:  ${icon} ${score}/100 alignment (${ageStr})${emergentStr}`);
        } catch {
          // No cached audit — suggest running it
          console.log(`  Audit:  ~ ${adrCount} ADRs found — run \x1b[36march audit .\x1b[0m for alignment score`);
        }
      }
    } catch { /* no adr dir — skip */ }

    console.log('');
  }

  async publishReport(): Promise<void> {
    console.log('\n  ARCH — arch status --publish');
    console.log('  \x1b[33m⚠ Warning: Materialized report is strictly non-authoritative.\x1b[0m');
    console.log('  This artifact is for human consumption only and must never be used as operational input.\n');

    const service = new StatusReportService(this.taskRepository, this.rootPath);
    const report = await service.generateReport();
    const markdown = service.generateMarkdown(report);

    await service.publish('README.md', markdown);
    await service.publish('docs/ROADMAP.md', markdown);

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
