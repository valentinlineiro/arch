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

export interface CausalRelation {
  from: string;
  to: string;
  relation: RelationType;
  timestamp: string;
  note?: string;
}
