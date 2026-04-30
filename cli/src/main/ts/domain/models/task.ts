export enum TaskStatus {
  IDEA = 'IDEA',
  BACKLOG = 'BACKLOG',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
  REJECTED = 'REJECTED'
}

export interface AcceptanceCriterion {
  description: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  priority: string;
  size: string;
  status: TaskStatus;
  focus: boolean;
  sprint: string;
  class: string;
  cli: string;
  context: string[];
  depends?: string[];
  lockedBy?: string;
  lockedAt?: string;
  closedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  acceptanceCriteria?: AcceptanceCriterion[];
  cost?: number;
  steps?: number;
  rawMetaLine?: string;
  rawDependsLine?: string;
}
