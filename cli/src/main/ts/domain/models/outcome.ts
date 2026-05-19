export type OutcomeSource = 'github_api' | 'ci' | 'sre' | 'custom';

export interface EngineeringOutcome {
  id: string;
  name: string;
  source: OutcomeSource;
  value: number;
  unit: string;
  timestamp: Date;
}

export interface GovernanceCorrelation {
  metricName: string;
  outcomeName: string;
  correlationCoefficient: number; // -1 to 1 (Pearson or similar heuristic)
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
  observationPeriodDays: number;
}

export interface TruthCalibrationReport {
  timestamp: Date;
  activeCorrelations: GovernanceCorrelation[];
  anomalies: string[]; // e.g., "Alignment is up but Velocity is down"
  suggestedCalibrations: string[]; // e.g., "Review ADR-005: possible friction bottleneck"
}
