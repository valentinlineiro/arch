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
    const entry = `## ${event.timestamp}\n${event.taskId} | ${event.from} -> ${event.to}\n\n`;
    
    let existing = '';
    try {
      existing = await this.fileSystem.readFile(this.EVENTS_PATH);
    } catch {
      existing = '# Event Log\n\n';
    }

    await this.fileSystem.writeFile(this.EVENTS_PATH, existing + entry);
  }
}
