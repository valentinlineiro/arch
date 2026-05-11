import type { FeedbackSignal } from '../models/feedback-signal.js';

export interface FeedbackRepository {
  readAll(): Promise<FeedbackSignal[]>;
  append(signal: FeedbackSignal): Promise<void>;
}
