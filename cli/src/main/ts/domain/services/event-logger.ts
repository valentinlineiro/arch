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
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository,
    private eventsPath: string = 'docs/EVENTS.md'
  ) {}

  async append(event: LifecycleEvent): Promise<void> {
    const commitId = await this.gitRepository.getLastCommitHash() || 'unknown';
    const agentId = event.agentId || process.env.AGENT_ID || 'human';
    const entry = `## ${event.timestamp}\n${event.taskId} | ${event.from} -> ${event.to} | commit:${commitId} | agent:${agentId}\n`;

    // Read existing content (or start fresh)
    let content: string;
    try {
      content = await this.fileSystem.readFile(this.eventsPath);
    } catch {
      content = '# Event Log\n\n';
    }

    // Parse existing sections to find correct insertion point
    const insertionPoint = this.findInsertionPoint(content, event.timestamp);
    const newContent = content.slice(0, insertionPoint) + entry + '\n' + content.slice(insertionPoint);

    await this.fileSystem.writeFile(this.eventsPath, newContent);
  }

  /**
   * Find the correct insertion point to maintain chronological order.
   * Returns the index after the last section whose timestamp <= new timestamp.
   */
  private findInsertionPoint(content: string, newTimestamp: string): number {
    const newMs = new Date(newTimestamp).getTime();

    // Find all ## timestamp headers and their positions
    const headerRegex = /^## (\d{4}-\d{2}-\d{2}T[\d:.Z+\-]+)/gm;
    let lastValidEnd = content.length;
    let match: RegExpExecArray | null;
    let prevEnd = content.length;

    // Collect all sections
    const sections: Array<{ ts: number; start: number }> = [];
    while ((match = headerRegex.exec(content)) !== null) {
      try {
        sections.push({ ts: new Date(match[1]).getTime(), start: match.index });
      } catch { /* skip unparseable */ }
    }

    // Find insertion point: after the last section with ts <= newMs
    // If newMs is greater than all existing, append at end
    // If newMs is less than first, prepend before first section
    let insertAfter = -1;
    for (const s of sections) {
      if (s.ts <= newMs) insertAfter = s.start;
      else break;
    }

    if (insertAfter === -1) {
      // New event is older than everything — insert before first section
      const firstSection = sections[0];
      if (firstSection) return firstSection.start;
      // No sections yet — append after header
      const headerEnd = content.indexOf('\n\n');
      return headerEnd >= 0 ? headerEnd + 2 : content.length;
    }

    // Find the end of the section at insertAfter
    const nextSectionIdx = sections.findIndex(s => s.start === insertAfter);
    const nextSection = sections[nextSectionIdx + 1];
    if (nextSection) return nextSection.start;
    return content.length;
  }
}
