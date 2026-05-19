import { EngineeringOutcome, TruthCalibrationReport, GovernanceCorrelation } from '../models/outcome.js';
import { GovernanceStabilityReport } from '../models/stability.js';

export class OutcomeValidationService {
  /**
   * Correlates internal governance stability with external engineering outcomes.
   * This is the "Truth Calibration" engine.
   */
  calibrate(
    stabilityReport: GovernanceStabilityReport,
    outcomes: EngineeringOutcome[]
  ): TruthCalibrationReport {
    const correlations = this.calculateCorrelations(stabilityReport, outcomes);
    const anomalies = this.detectAnomalies(correlations);
    
    return {
      timestamp: new Date(),
      activeCorrelations: correlations,
      anomalies,
      suggestedCalibrations: this.generateCalibrationSuggestions(anomalies)
    };
  }

  private calculateCorrelations(
    stability: GovernanceStabilityReport, 
    outcomes: EngineeringOutcome[]
  ): GovernanceCorrelation[] {
    // Simplified heuristic correlation logic
    // In a real system, this would use time-series regression.
    const results: GovernanceCorrelation[] = [];
    
    const alignmentHistory = stability.history.map(h => h.alignmentScore);
    const uniqueOutcomeNames = [...new Set(outcomes.map(o => o.name))];

    for (const outcomeName of uniqueOutcomeNames) {
      const outcomeValues = outcomes
        .filter(o => o.name === outcomeName)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(o => o.value);

      if (outcomeValues.length > 2) {
        results.push({
          metricName: 'AlignmentScore',
          outcomeName,
          correlationCoefficient: this.computeHeuristicCorrelation(alignmentHistory, outcomeValues),
          significance: outcomeValues.length > 5 ? 'HIGH' : 'LOW',
          observationPeriodDays: 30 // Placeholder
        });
      }
    }

    return results;
  }

  private detectAnomalies(correlations: GovernanceCorrelation[]): string[] {
    const anomalies: string[] = [];

    for (const corr of correlations) {
      // Negative correlation with Velocity/LeadTime is an anomaly
      if (corr.outcomeName === 'LeadTime' && corr.correlationCoefficient > 0.5) {
        // High Alignment correlating with High LeadTime = Bad
        anomalies.push(`Alignment Score is positively correlated with LeadTime (${corr.correlationCoefficient.toFixed(2)}). Governance may be causing friction.`);
      }
      
      if (corr.outcomeName === 'DefectRate' && corr.correlationCoefficient > -0.3) {
        // High Alignment SHOULD correlate with Low DefectRate. If it doesn't, governance is ineffective.
        anomalies.push(`Alignment Score is not significantly reducing DefectRate (${corr.correlationCoefficient.toFixed(2)}). Rules may be ceremonial.`);
      }
    }

    return anomalies;
  }

  private generateCalibrationSuggestions(anomalies: string[]): string[] {
    return anomalies.map(anomaly => {
      if (anomaly.includes('LeadTime')) {
        return 'Review high-friction Process Decisions (e.g., PR Review latency).';
      }
      if (anomaly.includes('DefectRate')) {
        return 'Review Architectural Decisions in modules with high churn but low alignment impact.';
      }
      return 'Monitor temporal consistency of current governance rules.';
    });
  }

  private computeHeuristicCorrelation(a: number[], b: number[]): number {
    // Basic direction-of-travel correlation for small datasets
    if (a.length < 2 || b.length < 2) return 0;
    
    // Naive simplification for this prototype
    const aTrend = a[a.length - 1] - a[0];
    const bTrend = b[b.length - 1] - b[0];
    
    if (aTrend === 0 || bTrend === 0) return 0;
    return (aTrend > 0 && bTrend > 0) || (aTrend < 0 && bTrend < 0) ? 0.8 : -0.8;
  }
}
