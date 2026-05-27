import { Command } from '../../domain/models/command.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { StatusReportService } from '../../domain/services/status-report-service.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

const ALERT_PREFIXES = ['[ANDON_HALT]', '[PATTERN-ALERT]', '[CORPUS_ALERT]'];

export function parseInboxAlerts(inbox: string): string[] {
  const lines = inbox.split('\n');
  let inAlertsSection = false;
  const alerts: string[] = [];
  for (const line of lines) {
    if (line.startsWith('## Alerts')) { inAlertsSection = true; continue; }
    if (inAlertsSection && line.startsWith('## ')) break;
    if (inAlertsSection && ALERT_PREFIXES.some(p => line.startsWith(p))) {
      alerts.push(line.trim());
    }
  }
  return alerts;
}

export class StatusCommand implements Command {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private rootPath: string = '.',
  ) {}

  async execute(args: string[] = []): Promise<number> {
    if (args.includes('--publish')) {
      await this.publishReport();
      return 0;
    }

    const tasks = await this.taskRepository.getAll();

    fmt.header('Session Status');

    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
    const review = tasks.filter(t => t.status === 'REVIEW');
    const ready = tasks.filter(t => t.status === 'READY');

    // Current work
    if (inProgress.length > 0) {
      fmt.log('  IN_PROGRESS:');
      for (const t of inProgress) {
        fmt.log(`    ${t.id}  ${t.priority} ${t.size}  ${t.title}`);
      }
    } else {
      fmt.log('  IN_PROGRESS: (none)');
    }

    // Needs audit
    if (review.length > 0) {
      fmt.log(`\n  REVIEW (needs audit):`);
      for (const t of review) {
        fmt.log(`    ${t.id}  ${t.priority} ${t.size}  ${t.title}`);
      }
    }

    // Next actionable task
    const nextTask = ready
      .filter(t => !this.isBlocked(t, tasks))
      .sort((a, b) => this.priorityScore(a) - this.priorityScore(b))[0];

    if (nextTask) {
      fmt.log(`\n  NEXT:  ${nextTask.id}  ${nextTask.priority} ${nextTask.size}  ${nextTask.title}`);
      fmt.log(`         arch task start ${nextTask.id}`);
    }

    // Backlog summary
    const unblocked = ready.filter(t => !this.isBlocked(t, tasks));
    const blocked = ready.filter(t => this.isBlocked(t, tasks));
    fmt.log(`\n  Backlog: ${unblocked.length} actionable, ${blocked.length} blocked`);

    // INBOX alerts
    try {
      const inbox = await this.fileSystem.readFile(`${this.rootPath}/${PathResolver.from({}).inbox}`);
      const alerts = parseInboxAlerts(inbox);
      if (alerts.length > 0) {
        fmt.log(`\n  \x1b[33m⚠\x1b[0m  Alerts (${alerts.length}):`);
        for (const a of alerts.slice(0, 3)) {
          fmt.log(`    ${a.slice(0, 80)}`);
        }
        if (alerts.length > 3) {
          fmt.log(`    ... ${alerts.length - 3} more — run arch govern inbox`);
        }
      }
    } catch { /* no inbox */ }

    // Last report integrity — with age annotation
    try {
      const metrics = await this.fileSystem.readFile(`${this.rootPath}/docs/METRICS.md`);
      const integrity = metrics.match(/\*\*Integrity Level\*\*\s*\|\s*(\S+)/)?.[1];
      if (integrity && integrity !== 'N/A') {
        const icon = integrity === 'HIGH' ? '✔' : integrity === 'LOW' ? '⚠' : '~';
        const lastUpdatedMatch = metrics.match(/\*Last updated: ([^*]+)\*/);
        let ageStr = '';
        if (lastUpdatedMatch) {
          const age = Math.round((Date.now() - new Date(lastUpdatedMatch[1].trim()).getTime()) / 3600000);
          ageStr = ` (${age < 1 ? 'just now' : age < 24 ? `${age}h ago` : `${Math.round(age / 24)}d ago`})`;
        }
        fmt.log(`\n  Report: ${icon} Integrity ${integrity}${ageStr}`);
      }
    } catch { /* no metrics */ }

    // Alignment score — only if ADRs exist and a cached score is available
    try {
      const adrDir = `${this.rootPath}/${PathResolver.from({}).adr}`;
      const adrFiles = await this.fileSystem.readDirectory(adrDir);
      const adrCount = adrFiles.filter(f => f.endsWith('.md') && !f.includes('template')).length;

      if (adrCount > 0) {
        // Try to read last audit score from last-audit.json
        try {
          const auditCache = await this.fileSystem.readFile(`${this.rootPath}/${PathResolver.from({}).archDir}/last-audit.json`);
          const { score, timestamp, emergentCount } = JSON.parse(auditCache);
          const age = Math.round((Date.now() - new Date(timestamp).getTime()) / 3600000);
          const icon = score >= 80 ? '\x1b[32m✔\x1b[0m' : score >= 60 ? '\x1b[33m⚠\x1b[0m' : '\x1b[31m✖\x1b[0m';
          const ageStr = age < 1 ? 'just now' : age < 24 ? `${age}h ago` : `${Math.round(age / 24)}d ago`;
          const emergentStr = emergentCount > 0 ? `  ${emergentCount} emergent` : '';
          fmt.log(`  Audit:  ${icon} ${score}/100 alignment (${ageStr})${emergentStr}`);
        } catch {
          // No cached audit — suggest running it
          fmt.log(`  Audit:  ~ ${adrCount} ADRs found — run \x1b[36march audit .\x1b[0m for alignment score`);
        }
      }
    } catch { /* no adr dir — skip */ }

    fmt.log('');
    return 0;
  }

  async publishReport(): Promise<void> {
    fmt.log('\n  ARCH — arch status --publish');
    fmt.log('  \x1b[33m⚠ Warning: Materialized report is strictly non-authoritative.\x1b[0m');
    fmt.log('  This artifact is for human consumption only and must never be used as operational input.\n');

    const service = new StatusReportService(this.taskRepository, this.rootPath);
    const report = await service.generateReport();
    const markdown = service.generateMarkdown(report);

    await service.publish('README.md', markdown);
    await service.publish('docs/ROADMAP.md', markdown);

    fmt.log('');
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
