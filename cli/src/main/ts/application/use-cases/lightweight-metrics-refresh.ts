import { FileSystem } from '../../domain/repositories/file-system.js';
import { TrustedMetrics } from './compute-trusted-metrics.js';

const METRICS_PATH = 'docs/METRICS.md';

/**
 * LightweightMetricsRefresh surgically replaces only the two Trusted Metrics
 * table rows in docs/METRICS.md:
 *   | **Completed Tasks** | ... |
 *   | **REVIEW_FAIL Rate** | ... |
 *
 * Everything else in METRICS.md (Cycle Time, Experimental Metrics, Epistemic
 * Digest) is left unchanged. Failure to read/write METRICS.md is non-fatal
 * (callers must wrap in try/catch).
 */
export class LightweightMetricsRefresh {
  constructor(private fileSystem: FileSystem) {}

  async execute(metrics: TrustedMetrics): Promise<void> {
    const content = await this.fileSystem.readFile(METRICS_PATH);
    const updated = this.applyMetrics(content, metrics);
    if (updated !== content) {
      await this.fileSystem.writeFile(METRICS_PATH, updated);
    }
  }

  private applyMetrics(content: string, metrics: TrustedMetrics): string {
    const failRateStr = metrics.reviewFailRate === 'pending'
      ? 'pending (insufficient event history)'
      : (metrics.reviewFailRate * 100).toFixed(1) + '%';

    let result = content;

    // Replace the Completed Tasks row value
    result = result.replace(
      /(\| \*\*Completed Tasks\*\* \| )([^|]+)(\| total archived \|)/,
      `$1${metrics.completedTasks} $3`
    );

    // Replace the REVIEW_FAIL Rate row value
    result = result.replace(
      /(\| \*\*REVIEW_FAIL Rate\*\* \| )([^|]+)(\| rejected \/ total review exits \|)/,
      `$1${failRateStr} $3`
    );

    // Update the Last updated timestamp — reflects when govern last refreshed this file
    const now = new Date().toISOString();
    result = result.replace(
      /\*Last updated: [^*]+\*/,
      `*Last updated: ${now}*`
    );

    return result;
  }
}
