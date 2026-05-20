import type { CorpusEntry } from '../../application/use-cases/corpus-index.js';

export interface DriftReport {
  severityShifting: boolean;
  proseAcIncreasing: boolean;
  signals: string[];
}

const SEVERITY_WEIGHTS: Record<string, number> = { H0: 0, H1: 1, H2: 2, H3a: 3, H3b: 3 };

export class GovernanceDriftDetector {
  static detect(entries: CorpusEntry[], windowSize: number): DriftReport {
    const dated = entries
      .filter(e => !!e.closedAt)
      .sort((a, b) => a.closedAt!.localeCompare(b.closedAt!));

    if (dated.length < windowSize * 2) {
      return { severityShifting: false, proseAcIncreasing: false, signals: [] };
    }

    const recent = dated.slice(-windowSize);
    const prior = dated.slice(-windowSize * 2, -windowSize);

    const avgSeverity = (es: CorpusEntry[]) =>
      es.reduce((sum, e) => sum + (SEVERITY_WEIGHTS[e.severity] ?? 0), 0) / es.length;

    const avgProseRatio = (es: CorpusEntry[]) =>
      es.reduce((sum, e) => {
        const prose = e.acCount - e.acMachineVerifiable;
        return sum + (e.acCount > 0 ? prose / e.acCount : 0);
      }, 0) / es.length;

    const recentSev = avgSeverity(recent);
    const priorSev = avgSeverity(prior);
    const recentProse = avgProseRatio(recent);
    const priorProse = avgProseRatio(prior);

    const signals: string[] = [];
    const severityShifting = recentSev > priorSev * 1.5 && recentSev > 0.5;
    const proseAcIncreasing = recentProse > priorProse + 0.15;

    if (severityShifting) {
      signals.push(`Hansei severity increasing: prior avg ${priorSev.toFixed(2)} → recent avg ${recentSev.toFixed(2)}`);
    }
    if (proseAcIncreasing) {
      signals.push(`Prose AC ratio increasing: prior ${(priorProse * 100).toFixed(0)}% → recent ${(recentProse * 100).toFixed(0)}% (machine-verifiable decreasing)`);
    }

    return { severityShifting, proseAcIncreasing, signals };
  }
}
