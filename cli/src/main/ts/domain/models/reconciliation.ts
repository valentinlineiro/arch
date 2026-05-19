import { Decision, DecisionType, DecisionStatus } from './decision.js';

export type DecisionSourceType = 'ADR' | 'CODEOWNERS' | 'PR_POLICY' | 'REPOSITORY_BEHAVIOR';

export interface DecisionSource {
  type: DecisionSourceType;
  confidence: number; // ADR = 1.0, BEHAVIOR = 0.4
  ref: string; // File path or "git-history"
}

export interface ReconciledDecision extends Decision {
  source: DecisionSource;
  reconciliationState: 'ALIGNED' | 'DIVERGENT' | 'STALE' | 'EMERGENT_ONLY';
  divergenceEvidenceIds: string[];
}

export interface OrganizationalTruthReport {
  timestamp: Date;
  alignmentScore: number; // 0-100
  topDivergences: ReconciledDecision[];
  unrecordedBehavioralPatterns: Decision[]; // Emergent decisions with no Declared counterpart
}
