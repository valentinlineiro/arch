export type RelationType =
  | 'implements'   // TASK implements an ADR decision
  | 'caused_by'    // TASK-X was caused by debt or failure from TASK-Y
  | 'violated'     // TASK violated a guideline or principle
  | 'fixes'        // TASK fixes a recurring pattern or prior task
  | 'spawned'      // TASK-X was spawned as follow-up from TASK-Y
  | 'references';  // explicit cross-reference without stronger causal claim

export const VALID_RELATIONS: readonly RelationType[] = [
  'implements', 'caused_by', 'violated', 'fixes', 'spawned', 'references',
];

// Internal taxonomy — not stored, used for query weighting and display.
// STRONG: structural dependency (the system required it to exist)
// MEDIUM: normative judgment (a human interpreted the relationship)
// WEAK:   contextual reference (no causal claim)
export const RELATION_STRENGTH: Record<RelationType, 'STRONG' | 'MEDIUM' | 'WEAK'> = {
  caused_by:  'STRONG',
  spawned:    'STRONG',
  implements: 'MEDIUM',
  fixes:      'MEDIUM',
  violated:   'MEDIUM',
  references: 'WEAK',
};

// Who asserted the edge and with what certainty.
// asserted:  a human explicitly recorded this relation
// inferred:  derived from cross-references or task metadata by a rule
// heuristic: co-occurrence signal — not a fact, just a hypothesis
export type Confidence = 'asserted' | 'inferred' | 'heuristic';

export const VALID_CONFIDENCES: readonly Confidence[] = ['asserted', 'inferred', 'heuristic'];

// Who originated the edge.
// human:  written by a human via arch causal add
// system: written by an automated process (govern, arch ask, etc.)
export type CausalSource = 'human' | 'system';

export interface CausalRelation {
  from: string;
  to: string;
  relation: RelationType;
  confidence: Confidence;
  source: CausalSource;
  timestamp: string;
  note?: string;
}
