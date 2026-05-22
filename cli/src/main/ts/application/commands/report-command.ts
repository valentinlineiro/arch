import { Command } from '../../domain/models/command.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { ArchiveParser } from '../../domain/services/archive-parser.js';
import { MetricsEngine, CalculatedMetrics } from '../../domain/services/metrics-engine.js';

export class ReportCommand implements Command {
  private readonly METRICS_PATH = 'docs/METRICS.md';

  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository
  ) {}

  async execute(): Promise<void> {
    const parser = new ArchiveParser(this.fileSystem, this.gitRepository);
    const engine = new MetricsEngine(this.fileSystem, this.gitRepository, this.paths.events);

    const archivedTasks = await parser.parseArchivedTasks();
    const metrics = await engine.calculate(archivedTasks);

    if (metrics.integrityLevel === 'INVALID') {
      const reportContent = this.formatReport(metrics);
      await this.updateMetricsFile(reportContent);
      console.error('\n  ✖ CRITICAL INTEGRITY BREACH: Report data is INVALID due to protocol violations or ledger corruption.');
      console.error('  Manual intervention required. Check docs/EVENTS.md and task metadata for discrepancies.');
      console.error('  docs/METRICS.md updated with INVALID report for diagnostics.\n');
      process.exit(1);
    }

    const reportContent = this.formatReport(metrics);
    await this.updateMetricsFile(reportContent);

    console.log('\n  ARCH — Operational Report\n');
    console.log(`  Completed: ${metrics.totalCompleted} tasks`);
    console.log(`  REVIEW_FAIL: ${metrics.reviewFailRate === 'pending' ? 'pending' : (metrics.reviewFailRate * 100).toFixed(1) + '%'}`);
    const costLabel = metrics.costPerTask.realCount > 0
      ? `$${metrics.costPerTask.average.toFixed(2)} (${metrics.costPerTask.realCount} real, ${metrics.costPerTask.heuristicCount} heuristic)`
      : `$${metrics.costPerTask.average.toFixed(2)} (heuristic)`;
    console.log(`  Avg Cost: ${costLabel}`);
    console.log('\n  Cycle Time (P50/P90):');
    for (const size of ['XS', 'S', 'M', 'L']) {
      const { p50, p90, count } = metrics.cycleTime[size];
      const p50Str = p50 !== null ? p50.toFixed(1) + 'h' : 'N/A';
      const p90Str = p90 !== null ? p90.toFixed(1) + 'h' : 'N/A';
      console.log(`    ${size}: ${p50Str} / ${p90Str} (${count} tasks)`);
    }
    // Actor breakdown (requires TASK-911 Actor field + >=5 actor-tagged tasks)
    if (metrics.actorBreakdown && metrics.actorBreakdown.length > 0) {
      console.log('\n  Actor Breakdown:');
      for (const entry of metrics.actorBreakdown) {
        const turns = entry.avgTurns !== null ? `avg ${entry.avgTurns} turns` : 'no turn data';
        console.log(`    ${entry.actor.padEnd(32)} ${entry.size}  ${String(entry.taskCount).padStart(3)} tasks  ${turns}`);
      }
    }

    // Hansei category breakdown
    if (metrics.hanseiBreakdown && metrics.hanseiBreakdown.length > 0) {
      console.log('\n  Hansei Signals (H2+):');
      for (const entry of metrics.hanseiBreakdown) {
        const weakTag = entry.isWeakSignal ? ' ⚠ WEAK SIGNAL' : '';
        console.log(`    ${entry.category.padEnd(28)} ${String(entry.count).padStart(3)}x  [${entry.severities.join(', ')}]${weakTag}`);
      }
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

    report += `### Trusted Metrics\n\n`;
    report += `| Metric | Value | Notes |\n`;
    report += `|--------|-------|-------|\n`;
    report += `| **Completed Tasks** | ${metrics.totalCompleted} | total archived |\n`;
    report += `| **REVIEW_FAIL Rate** | ${failRateStr} | rejected / total review exits |\n\n`;

    report += `### Cycle Time (P50/P90)\n\n`;
    report += `| Size | P50 | P90 | Count |\n`;
    report += `|------|-----|-----|-------|\n`;
    for (const size of ['XS', 'S', 'M', 'L']) {
      const { p50, p90, count } = metrics.cycleTime[size];
      report += `| ${size} | ${p50 !== null ? p50.toFixed(1) + 'h' : 'N/A'} | ${p90 !== null ? p90.toFixed(1) + 'h' : 'N/A'} | ${count} |\n`;
    }

    report += `\n### Experimental Metrics\n\n`;
    report += `> Confidence is below the threshold required for canonical use. Do not use for decisions.\n\n`;
    report += `| Metric | Value | Notes |\n`;
    report += `|--------|-------|-------|\n`;
    report += `| **Integrity Level** | ${metrics.integrityLevel} | CONFIDENCE: ${(100 - metrics.integrityEntropy * 100).toFixed(0)}% — calibration insufficient |\n`;
    report += `| **Avg Cost / Task** | $${metrics.costPerTask.average.toFixed(2)} | token-estimate heuristic v1 — not measured from billing |\n\n`;

    report += `> **Epistemic Digest:** \`${metrics.provenance.methodId}\` (Range: \`${metrics.provenance.gitRevRange}\`)\n`;

    return report;
  }

  private getIntegrityNote(metrics: CalculatedMetrics): string {
    if (metrics.integrityLevel === 'HIGH') {
      return 'Truth calibration is HIGH. All baselines are anchored to explicit metadata and zero-drift snapshots.';
    }
    if (metrics.integrityLevel === 'MEDIUM') {
      return `Truth calibration is MEDIUM. ${(metrics.integrityEntropy * 100).toFixed(0)}% of metrics are inferred from git history provenance (ADR-018).`;
    }
    if (metrics.integrityLevel === 'LOW') {
      return 'Truth calibration is LOW. Significant environmental noise or missing baselines detected. Metrics are for diagnostic use only.';
    }
    return 'CRITICAL INTEGRITY BREACH: Report data is INVALID due to protocol violations or ledger corruption.';
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

    // Severity 4: Ambiguity - fail on malformed tags instead of appending
    if (startIndex === -1 || endIndex === -1) {
      throw new Error(`Integrity Violation: Malformed or missing GENERATED tags in ${this.METRICS_PATH}. Manual intervention required.`);
    }

    const before = content.substring(0, startIndex + startTag.length);
    const after = content.substring(endIndex);
    content = `${before}\n${reportContent}\n${after}`;

    await this.fileSystem.writeFile(this.METRICS_PATH, content);
  }
}
