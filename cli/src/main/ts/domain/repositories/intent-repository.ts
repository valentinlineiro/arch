import type { Intent } from '../models/intent.js';

export interface IntentRepository {
  getNextId(): Promise<string>;
  save(intent: Intent): Promise<void>;
}
