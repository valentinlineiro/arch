import type { FileSystem } from '../repositories/file-system.js';
import type { GitRepository } from '../repositories/git-repository.js';

export interface LifecycleEvent {
  taskId: string;
  from: string;
  to: string;
  timestamp: string;
  agentId?: string;
}

export class EventLogger {
  private readonly EVENTS_PATH = 'docs/EVENTS.md';

  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository
  ) {}

  async append(event: LifecycleEvent): Promise<void> {
    if (!(await this.fileSystem.exists(this.EVENTS_PATH))) {
      await this.fileSystem.writeFile(this.EVENTS_PATH, '# Event Log\n\n');
    }

    const commitId = await this.gitRepository.getLastCommitHash() || 'unknown';
    const agentId = event.agentId || process.env.AGENT_ID || 'human';

    const entry = `## ${event.timestamp}\n${event.taskId} | ${event.from} -> ${event.to} | commit:${commitId} | agent:${agentId}\n\n`;
    await this.fileSystem.appendFile(this.EVENTS_PATH, entry);
  }
}
