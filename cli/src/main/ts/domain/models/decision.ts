export type DecisionType = 'ARCHITECTURAL' | 'PROCESS' | 'OWNERSHIP';
export type DecisionStatus = 'SUPPORTED' | 'CONTRADICTED' | 'INSUFFICIENT_EVIDENCE';
export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Decision {
  id: string; // Canonical ID
  type: DecisionType;
  
  // What is this decision about? (e.g., module:auth, process:review-policy)
  subject: string; 
  
  title: string;
  description: string;
  
  // The intended state (e.g., "Must have 2 reviewers", "Owned by @team-a")
  intendedState: any; 

  status: DecisionStatus;
  impact: ImpactLevel;
  
  // The trail of evidence that supports or contradicts this decision
  evidenceIds: string[]; 
  
  metadata: {
    source: 'adr' | 'codeowners' | 'config' | 'guideline';
    definedAt: Date;
    author?: string;
  };
}

export interface DecisionImpact {
  decisionId: string;
  riskScore: number; // 0-100
  driftProbability: number; // 0-1
  remediationCost: 'LOW' | 'MEDIUM' | 'HIGH';
  businessRisk: string; // Plain language description of what happens if this fails
}
