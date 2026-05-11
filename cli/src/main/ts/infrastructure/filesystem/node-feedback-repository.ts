import type { FeedbackRepository } from '../../domain/repositories/feedback-repository.js';
import type { FeedbackSignal } from '../../domain/models/feedback-signal.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';

const FEEDBACK_PATH = '.arch/context-feedback.json';

export class NodeFeedbackRepository implements FeedbackRepository {
  constructor(private fileSystem: FileSystem) {}

  async readAll(): Promise<FeedbackSignal[]> {
    try {
      const raw = await this.fileSystem.readFile(FEEDBACK_PATH);
      return JSON.parse(raw) as FeedbackSignal[];
    } catch {
      return [];
    }
  }

  async append(signal: FeedbackSignal): Promise<void> {
    const existing = await this.readAll();
    existing.push(signal);
    await this.fileSystem.mkdir('.arch');
    await this.fileSystem.writeFile(FEEDBACK_PATH, JSON.stringify(existing, null, 2));
  }
}
