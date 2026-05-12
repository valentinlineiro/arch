export type ProposalType = 'PROMOTE' | 'DEMOTE' | 'EXTEND' | 'SIGNAL';

export interface ReflectProposal {
  proposal_id: string;
  timestamp: string;
  target: string;
  type: ProposalType;
  confidence: number;
  rationale_ref?: string;
  signals_used: string[];
}
