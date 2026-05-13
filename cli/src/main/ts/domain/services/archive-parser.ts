import { FileSystem } from '../repositories/file-system.js';
import { GitRepository } from '../repositories/git-repository.js';
import path from 'node:path';

export interface ArchivedTaskMetrics {
  id: string;
  size: string;
  class: string;
  completedAt: string | null;
  createdAt: string | null;
  turns: number | null;
  cost: number | null;
}

export class ArchiveParser {
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository
  ) {}

  async parseArchivedTasks(): Promise<ArchivedTaskMetrics[]> {
    const archiveDir = 'docs/archive';
    if (!(await this.fileSystem.exists(archiveDir))) {
      return [];
    }

    const files = await this.fileSystem.readDirectory(archiveDir);
    const taskFiles = files.filter(f => f.startsWith('TASK-') && f.endsWith('.md'));

    const metrics: ArchivedTaskMetrics[] = [];

    for (const file of taskFiles) {
      const filePath = path.join(archiveDir, file);
      const content = await this.fileSystem.readFile(filePath);
      
      const metric = await this.parseTaskContent(file.replace('.md', ''), content, filePath);
      metrics.push(metric);
    }

    return metrics;
  }

  private async parseTaskContent(id: string, content: string, filePath: string): Promise<ArchivedTaskMetrics> {
    const metaMatch = content.match(/\*\*Meta:\*\*\s*(.+)/);
    const metaLine = metaMatch ? metaMatch[1] : '';
    const metaParts = metaLine.split('|').map(p => p.trim());

    // Meta: P[0-3] | [Size] | [STATUS] | Focus:yes/no | [Class] | [CLI] | [Context] | Turns: N | Cost: $N
    const size = metaParts[1] || 'Unknown';
    const taskClass = metaParts[4] || 'Unknown';

    const closedAtMatch = content.match(/\*\*Closed-at:\*\*\s*([^\s\*]+)/) || content.match(/Closed-at:\s*([^\s\*]+)/);
    const completedAt = closedAtMatch ? closedAtMatch[1] : null;

    const turnsMatch = metaLine.match(/Turns:\s*(\d+)/);
    const turns = turnsMatch ? parseInt(turnsMatch[1], 10) : null;

    const costMatch = metaLine.match(/Cost:\s*\$?(\d+\.\d+)/);
    const cost = costMatch ? parseFloat(costMatch[1]) : null;

    let createdAt: string | null = null;
    const firstCommitDate = await this.gitRepository.getFileFirstCommitDate(filePath);
    if (firstCommitDate) {
      createdAt = firstCommitDate.toISOString();
    }

    return {
      id,
      size,
      class: taskClass,
      completedAt,
      createdAt,
      turns,
      cost
    };
  }
}
