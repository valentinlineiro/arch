export type SprintStatus = 'ACTIVE' | 'CLOSED' | 'NEXT_PENDING';

export interface Sprint {
  name: string;
  status: SprintStatus;
  startedAt: string;       // ISO-8601
  closedAt?: string;       // ISO-8601, set when status → CLOSED
  velocity?: number;       // tasks completed in this sprint
  target?: string;         // optional human-readable goal
}

export interface SprintTransitionEvent {
  type: 'SPRINT_OPEN' | 'SPRINT_CLOSE' | 'SPRINT_NEXT_PENDING';
  sprintName: string;
  timestamp: string;
  velocity?: number;
}
