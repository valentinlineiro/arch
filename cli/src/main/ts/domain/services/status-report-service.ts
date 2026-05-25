import fs from 'node:fs';
import path from 'node:path';
import type { TaskRepository } from '../repositories/task-repository.js';
import { TaskStatus } from '../models/task.js';
import { PathResolver } from './path-resolver.js';

export interface PrimitiveStatusReport {
  schemaVersion: "1.0.0";
  timestamp: string;
  sprintId: string;
  rawCounts: {
    READY: number;
    IN_PROGRESS: number;
    REVIEW: number;
    BLOCKED: number;
    DONE: number;
  };
  auditScore: number;
}

export class StatusReportService {
  constructor(
    private taskRepository: TaskRepository,
    private rootPath: string = '.',
  ) {}

  async generateReport(): Promise<PrimitiveStatusReport> {
    const allTasks = await this.taskRepository.getAll();
    const config = this.loadConfig();

    const report: PrimitiveStatusReport = {
      schemaVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      sprintId: config.currentSprint || 'none',
      rawCounts: {
        READY: allTasks.filter(t => t.status === TaskStatus.READY).length,
        IN_PROGRESS: allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
        REVIEW: allTasks.filter(t => t.status === TaskStatus.REVIEW).length,
        BLOCKED: allTasks.filter(t => t.status === TaskStatus.BLOCKED).length,
        DONE: this.getArchiveCount(),
      },
      auditScore: this.getLatestAuditScore(),
    };

    this.saveSchema(report);
    return report;
  }

  private saveSchema(report: PrimitiveStatusReport): void {
    const projectionPath = path.join(this.rootPath, PathResolver.from({}).statusProjection);
    try {
      fs.writeFileSync(projectionPath, JSON.stringify(report, null, 2), 'utf8');
    } catch {
      // Non-fatal if .arch dir is somehow missing
    }
  }

  generateMarkdown(report: PrimitiveStatusReport): string {
    return [
      '<!-- ARCH-REPORT:START -->',
      '#### ARCH Materialized Status',
      `**Generated:** ${report.timestamp}`,
      `**Sprint ID:** ${report.sprintId}`,
      '',
      '| Status | Count |',
      '| :--- | :--- |',
      `| Ready | ${report.rawCounts.READY} |`,
      `| In Progress | ${report.rawCounts.IN_PROGRESS} |`,
      `| Review | ${report.rawCounts.REVIEW} |`,
      `| Blocked | ${report.rawCounts.BLOCKED} |`,
      `| Done (Archive) | ${report.rawCounts.DONE} |`,
      '',
      `**Audit Score:** ${report.auditScore}/100`,
      '<!-- ARCH-REPORT:END -->'
    ].join('\n');
  }

  async publish(filePath: string, markdown: string): Promise<void> {
    const fullPath = path.resolve(this.rootPath, filePath);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');
    const startTag = '<!-- ARCH-REPORT:START -->';
    const endTag = '<!-- ARCH-REPORT:END -->';

    const startIdx = content.indexOf(startTag);
    const endIdx = content.indexOf(endTag);

    if (startIdx === -1 || endIdx === -1) {
      console.warn(`  ⚠ Tags missing in ${filePath}. Skipping injection.`);
      return;
    }

    const before = content.slice(0, startIdx);
    const after = content.slice(endIdx + endTag.length);

    const newContent = before + markdown + after;
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`  ✔ Published report to ${filePath}`);
  }

  private loadConfig(): any {
    try {
      return JSON.parse(fs.readFileSync(path.join(this.rootPath, 'arch.config.json'), 'utf8'));
    } catch {
      return {};
    }
  }

  private getArchiveCount(): number {
    try {
      const archiveDir = path.join(this.rootPath, PathResolver.from({}).archive);
      return fs.readdirSync(archiveDir).filter(f => f.endsWith('.md')).length;
    } catch {
      return 0;
    }
  }

  private getLatestAuditScore(): number {
    try {
      const metricsPath = path.join(this.rootPath, 'docs/METRICS.md');
      const content = fs.readFileSync(metricsPath, 'utf8');
      const match = content.match(/\| Alignment audit \| (\d+)\/100 \|/);
      return match ? parseInt(match[1], 10) : 100;
    } catch {
      return 100;
    }
  }
}
