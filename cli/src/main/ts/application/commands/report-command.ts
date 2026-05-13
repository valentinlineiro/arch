import { FileSystem } from '../../domain/repositories/file-system.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { ArchiveParser } from '../../domain/services/archive-parser.js';
import { MetricsEngine, CalculatedMetrics } from '../../domain/services/metrics-engine.js';

export class ReportCommand {
  private readonly METRICS_PATH = 'docs/METRICS.md';

  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository
  ) {}

  async execute(): Promise<void> {
    const parser = new ArchiveParser(this.fileSystem, this.gitRepository);
    const engine = new MetricsEngine(this.fileSystem);

    const archivedTasks = await parser.parseArchivedTasks();
    const metrics = await engine.calculate(archivedTasks);

    const reportContent = this.formatReport(metrics);
    await this.updateMetricsFile(reportContent);

    console.log('\n  ARCH — Operational Report\n');
    console.log(`  Completed: ${metrics.totalCompleted} tasks`);
    console.log(`  REVIEW_FAIL: ${metrics.reviewFailRate === 'pending' ? 'pending' : (metrics.reviewFailRate * 100).toFixed(1) + '%'}`);
    console.log(`  Avg Cost: $${metrics.costPerTask.average.toFixed(2)} (heuristic v1)`);
    console.log('\n  Cycle Time (P50/P90):');
    for (const size of ['XS', 'S', 'M', 'L']) {
      const { p50, p90, count } = metrics.cycleTime[size];
      const p50Str = p50 !== null ? p50.toFixed(1) + 'h' : 'N/A';
      const p90Str = p90 !== null ? p90.toFixed(1) + 'h' : 'N/A';
      console.log(`    ${size}: ${p50Str} / ${p90Str} (${count} tasks)`);
    }
    console.log('\n  ✔ docs/METRICS.md updated.');
  }

  private formatReport(metrics: CalculatedMetrics): string {
    const ts = new Date().toISOString();
    const failRateStr = metrics.reviewFailRate === 'pending' 
      ? 'pending (insufficient event history)' 
      : (metrics.reviewFailRate * 100).toFixed(1) + '%';

    let report = `## Operational Metrics\n\n`;
    report += `*Last updated: ${ts}*\n\n`;
    
    report += `| Metric | Value | Notes |\n`;
    report += `|--------|-------|-------|\n`;
    report += `| **Completed Tasks** | ${metrics.totalCompleted} | total archived |\n`;
    report += `| **REVIEW_FAIL Rate** | ${failRateStr} | rejected / total review exits |\n`;
    report += `| **Avg Cost / Task** | $${metrics.costPerTask.average.toFixed(2)} | token-estimate heuristic v1 |\n\n`;

    report += `### Cycle Time (P50/P90)\n\n`;
    report += `| Size | P50 | P90 | Count |\n`;
    report += `|------|-----|-----|-------|\n`;
    for (const size of ['XS', 'S', 'M', 'L']) {
      const { p50, p90, count } = metrics.cycleTime[size];
      report += `| ${size} | ${p50 !== null ? p50.toFixed(1) + 'h' : 'N/A'} | ${p90 !== null ? p90.toFixed(1) + 'h' : 'N/A'} | ${count} |\n`;
    }
    
    report += `\n\n*Cost per task uses token-estimate heuristic v1 if absent from meta: XS=$0.05, S=$0.10, M=$0.25, L=$0.50*\n`;

    return report;
  }

  private async updateMetricsFile(reportContent: string): Promise<void> {
    let content = '';
    try {
      content = await this.fileSystem.readFile(this.METRICS_PATH);
    } catch {
      content = '# ARCH Metrics\n\n<!-- GENERATED:START -->\n<!-- GENERATED:END -->\n';
    }

    const startTag = '<!-- GENERATED:START -->';
    const endTag = '<!-- GENERATED:END -->';

    const startIndex = content.indexOf(startTag);
    const endIndex = content.indexOf(endTag);

    if (startIndex === -1 || endIndex === -1) {
      // Tags missing, append at the end
      content += `\n${startTag}\n${reportContent}\n${endTag}\n`;
    } else {
      const before = content.substring(0, startIndex + startTag.length);
      const after = content.substring(endIndex);
      content = `${before}\n${reportContent}\n${after}`;
    }

    await this.fileSystem.writeFile(this.METRICS_PATH, content);
  }
}
