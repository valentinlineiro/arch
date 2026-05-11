import type { Intent } from '../models/intent.js';

export interface IntentRepository {
  getNextId(): Promise<string>;
  save(intent: Intent): Promise<void>;
  getById(id: string): Promise<Intent | null>;
  update(intent: Intent): Promise<void>;
  findCaptured(): Promise<Intent[]>;
}
