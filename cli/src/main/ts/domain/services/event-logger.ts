import type { FileSystem } from '../repositories/file-system.js';

export interface LifecycleEvent {
  taskId: string;
  from: string;
  to: string;
  timestamp: string;
}

export class EventLogger {
  private readonly EVENTS_PATH = 'docs/EVENTS.md';

  constructor(private fileSystem: FileSystem) {}

  async append(event: LifecycleEvent): Promise<void> {
    if (!(await this.fileSystem.exists(this.EVENTS_PATH))) {
      await this.fileSystem.writeFile(this.EVENTS_PATH, '# Event Log\n\n');
    }

    const entry = `## ${event.timestamp}\n${event.taskId} | ${event.from} -> ${event.to}\n\n`;
    await this.fileSystem.appendFile(this.EVENTS_PATH, entry);
  }
}
