import { EvidenceEvent } from './evidence.js';

export type ActionType = 
  | 'CREATE_ADR' 
  | 'UPDATE_CODEOWNERS' 
  | 'OPEN_PR_REVIEW' 
  | 'DEPRECATE_DECISION' 
  | 'SUGGEST_REFACTOR'
  | 'NO_ACTION';

export type ActionPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type ActionStatus = 'SUGGESTED' | 'APPROVED' | 'REJECTED' | 'DEFERRED' | 'EXECUTED';

export interface ActionFeedback {
  result: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  alignmentImpact: number; // Actual change in Alignment Score after execution
  notes?: string;
  providedAt: Date;
}

export interface ImpactAction {
  id: string; // Unique action ID
  type: ActionType;
  priority: ActionPriority;
  status: ActionStatus;
  
  target: string; // The module, file, or process affected
  description: string;
  
  justification: {
    reason: string;
    evidenceIds: string[];
  };

  feedback?: ActionFeedback;

  metadata: {
    decisionId?: string; // The decision that triggered this
    detectedAt: Date;
    resolvedAt?: Date;
  };
}

export interface RemediationPlan {
  timestamp: Date;
  actions: ImpactAction[];
  totalRiskReduction: number; // Potential improvement in Alignment Score
}
