export enum BatchStatus {
  QUEUED = 'queued',
  SUBMITTED = 'submitted',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface BatchEntry {
  taskId: string;
  promptPath: string;
  status: BatchStatus;
  batchId?: string;
  result?: string;
  createdAt: string;
  submittedAt?: string;
  completedAt?: string;
}
