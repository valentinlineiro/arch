import { ReconciledDecision, OrganizationalTruthReport } from '../models/reconciliation.js';
import { ImpactAction } from '../models/action.js';
import { GovernanceStabilityReport, StabilityMetrics, TemporalSnapshot } from '../models/stability.js';

export class GovernanceStabilityService {
  /**
   * Analyzes the history of reports and actions to determine if the organization 
   * is structurally converging or diverging.
   */
  analyze(
    reportHistory: OrganizationalTruthReport[],
    actionHistory: ImpactAction[]
  ): GovernanceStabilityReport {
    const history = this.buildSnapshots(reportHistory, actionHistory);
    const metrics = this.calculateMetrics(reportHistory, actionHistory);
    const trend = this.deriveTrend(history);

    return {
      trend,
      confidence: this.calculateConfidence(history),
      metrics,
      history
    };
  }

  private buildSnapshots(reports: OrganizationalTruthReport[], actions: ImpactAction[]): TemporalSnapshot[] {
    return reports.map(report => {
      const pendingAtTime = actions.filter(a => 
        a.metadata.detectedAt <= report.timestamp && 
        (!a.metadata.resolvedAt || a.metadata.resolvedAt > report.timestamp)
      ).length;

      return {
        timestamp: report.timestamp,
        alignmentScore: report.alignmentScore,
        activeDivergences: report.topDivergences.length,
        pendingActions: pendingAtTime
      };
    });
  }

  private calculateMetrics(reports: OrganizationalTruthReport[], actions: ImpactAction[]): StabilityMetrics {
    return {
      decisionVolatility: this.calculateDecisionVolatility(reports),
      interventionConsistency: this.calculateInterventionConsistency(actions),
      meanTimeToResolution: this.calculateMTTR(actions),
      driftConvergenceRate: this.calculateConvergenceRate(reports)
    };
  }

  private deriveTrend(history: TemporalSnapshot[]): 'CONVERGING' | 'DIVERGING' | 'STAGNANT' {
    if (history.length < 2) return 'STAGNANT';
    
    const first = history[0].alignmentScore;
    const last = history[history.length - 1].alignmentScore;
    const diff = last - first;

    if (diff > 5) return 'CONVERGING';
    if (diff < -5) return 'DIVERGING';
    return 'STAGNANT';
  }

  private calculateDecisionVolatility(reports: OrganizationalTruthReport[]): number {
    // Placeholder: Measures how often the same DecisionID flips between ALIGNED and DIVERGENT
    return 0.1; 
  }

  private calculateInterventionConsistency(actions: ImpactAction[]): number {
    // Placeholder: Measures if ARCH suggests the same ActionType for the same target over time
    return 0.85;
  }

  private calculateMTTR(actions: ImpactAction[]): number {
    const resolved = actions.filter(a => a.metadata.resolvedAt);
    if (resolved.length === 0) return 0;

    const totalLag = resolved.reduce((acc, a) => {
      return acc + (a.metadata.resolvedAt!.getTime() - a.metadata.detectedAt.getTime());
    }, 0);

    return totalLag / resolved.length / (1000 * 60 * 60 * 24); // Days
  }

  private calculateConvergenceRate(reports: OrganizationalTruthReport[]): number {
    if (reports.length < 2) return 0;
    const first = reports[0];
    const last = reports[reports.length - 1];
    const timeDelta = (last.timestamp.getTime() - first.timestamp.getTime()) / (1000 * 60 * 60 * 24); // Days
    
    return timeDelta > 0 ? (last.alignmentScore - first.alignmentScore) / timeDelta : 0;
  }

  private calculateConfidence(history: TemporalSnapshot[]): number {
    return Math.min(history.length / 10, 1.0); // 1.0 confidence after 10 snapshots
  }
}
