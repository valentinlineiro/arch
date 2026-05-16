export enum TaskStatus {
  DRAFT = 'DRAFT',
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

export interface Hansei {
  severity: 'H0' | 'H1' | 'H2' | 'H3a' | 'H3b';
  category: string;
  decision: string;
  constraint: string;
  cost: string;
  forwardAction: string;
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
  lockedCommit?: string;
  createdAt?: string;
  closedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  acceptanceCriteria?: AcceptanceCriterion[];
  hansei?: Hansei;
  cost?: number;
  steps?: number;
  rawMetaLine?: string;
  rawDependsLine?: string;
  content: string;
  filePath: string;
}

export interface TaskRepository {
  getById(id: string): Promise<Task | null>;
  getAll(): Promise<Task[]>;
  getActive(): Promise<Task[]>;
  save(task: Task): Promise<void>;
  findReady(): Promise<Task[]>;
  getNextId(): Promise<string>;
  parseTask(content: string): Task | null;
}
