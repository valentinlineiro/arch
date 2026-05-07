export interface ArchEvent {
  id: string;
  type: string;
  timestamp: string;
  subject: string;
  payload: Record<string, any>;
}

export interface EventRepository {
  append(event: ArchEvent): Promise<void>;
}
