export type DecisionOutcome = 'PROMOTE' | 'DEMOTE' | 'EXTEND' | 'REJECT';

export interface ReflectDecision {
  decision_id: string;
  timestamp: string;
  target: string;
  outcome: DecisionOutcome;
  influence_declared: boolean; // true = human engaged with attribution system; false = undeclared
  based_on_proposals: string[]; // non-empty = attributed; empty + influence_declared = declared non-influence
}
