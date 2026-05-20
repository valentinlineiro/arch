export interface VerifiabilityReport {
  machineVerifiable: number;
  total: number;
  score: number;
  belowThreshold: boolean;
}

const MACHINE_PREDICATE = /^\s+-\s+`(cmd|file):/gim;
const ANY_PREDICATE = /^\s+-\s+`(cmd|file|prose):/gim;

export class VerifiabilityScorer {
  static readonly WARN_THRESHOLD = 50;

  static score(taskContent: string): VerifiabilityReport {
    const total = [...taskContent.matchAll(ANY_PREDICATE)].length;
    const machineVerifiable = [...taskContent.matchAll(MACHINE_PREDICATE)].length;
    const score = total === 0 ? 0 : Math.round((machineVerifiable / total) * 100);
    return {
      machineVerifiable,
      total,
      score,
      belowThreshold: score < VerifiabilityScorer.WARN_THRESHOLD,
    };
  }

  static format(report: VerifiabilityReport): string {
    if (report.total === 0) {
      return '  ⚠ Verifiability: no predicates declared — add cmd:/file: predicates';
    }
    const label = `${report.machineVerifiable}/${report.total} ACs machine-verifiable (${report.score}%)`;
    return report.belowThreshold
      ? `  ⚠ Verifiability: ${label} — add cmd:/file: predicates`
      : `  ✔ Verifiability: ${label}`;
  }
}
