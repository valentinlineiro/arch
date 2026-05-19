import { ReconciledDecision } from './reconciliation.js';
import { ImpactAction } from './action.js';

export interface StabilityMetrics {
  decisionVolatility: number; // Rate of state changes per decision over time
  interventionConsistency: number; // How often ARCH suggests the same action for a persistent problem
  meanTimeToResolution: number; // Lag between suggestion and EXECUTED status
  driftConvergenceRate: number; // ΔAlignmentScore / Time
}

export interface TemporalSnapshot {
  timestamp: Date;
  alignmentScore: number;
  activeDivergences: number;
  pendingActions: number;
}

export interface GovernanceStabilityReport {
  trend: 'CONVERGING' | 'DIVERGING' | 'STAGNANT';
  confidence: number; // Reliability of the trend based on data volume
  metrics: StabilityMetrics;
  history: TemporalSnapshot[];
}
