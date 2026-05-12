export type DecisionOutcome = 'PROMOTE' | 'DEMOTE' | 'EXTEND' | 'REJECT' | 'INDEPENDENT';

export interface ReflectDecision {
  decision_id: string;
  timestamp: string;
  target: string;
  outcome: DecisionOutcome;
  based_on_proposals: string[]; // empty when outcome is INDEPENDENT or when no proposals cited
}
