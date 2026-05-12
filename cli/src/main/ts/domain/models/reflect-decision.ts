export type DecisionOutcome = 'PROMOTE' | 'DEMOTE' | 'EXTEND' | 'REJECT';
export type DecisionFinality = 'committed' | 'superseded';

export interface ReflectDecision {
  decision_id: string;
  timestamp: string;
  target: string;
  outcome: DecisionOutcome;
  finality: DecisionFinality;
  influence_declared: boolean;
  based_on_proposals: string[];
}

export interface ReflectDecisionUpdate {
  decision_id: string; // references the original ReflectDecision
  finality: 'superseded';
  timestamp: string;
  superseded_by?: string; // decision_id of the replacement, if known
}
