import { FileSystem } from '../repositories/file-system.js';
import { GitRepository } from '../repositories/git-repository.js';
import path from 'node:path';

export interface EpistemicDigest {
  methodId: string;
  gitRevRange: string;
}

export interface ArchivedTaskMetrics {
  id: string;
  size: string;
  class: string;
  completedAt: string | null;
  createdAt: string | null;
  turns: number | null;
  cost: number | null;
  integrity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INVALID';
  provenance?: EpistemicDigest;
}

export class ArchiveParser {
  private creationDateMap: Map<string, string> = new Map();

  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository
  ) {}

  async parseArchivedTasks(): Promise<ArchivedTaskMetrics[]> {
    const archiveDir = 'docs/archive';
    if (!(await this.fileSystem.exists(archiveDir))) {
      return [];
    }

    // Severity 3: Scalable Git Ops - Single pass to map all creation dates
    await this.warmCreationDateMap();

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

  private async warmCreationDateMap(): Promise<void> {
    const commits = await this.gitRepository.getCommitHistory(1000);
    // Commits are newest first. To get first commit, we iterate backwards or use a map
    // and only set if not already present.
    for (let i = commits.length - 1; i >= 0; i--) {
      const commit = commits[i];
      for (const file of commit.files) {
        if (!this.creationDateMap.has(file)) {
          this.creationDateMap.set(file, commit.date);
        }
      }
    }
  }

  private async parseTaskContent(id: string, content: string, filePath: string): Promise<ArchivedTaskMetrics> {
    const metaMatch = content.match(/\*\*Meta:\*\*\s*(.+)/);
    const metaLine = metaMatch ? metaMatch[1] : '';
    const metaParts = metaLine.split('|').map(p => p.trim());

    const size = metaParts[1] || 'Unknown';
    const taskClass = metaParts[4] || 'Unknown';

    const closedAtMatch = content.match(/\*\*Closed-at:\*\*\s*([^\s\*]+)/) || content.match(/Closed-at:\s*([^\s\*]+)/);
    const completedAt = closedAtMatch ? closedAtMatch[1] : null;

    const turnsMatch = metaLine.match(/Turns:\s*(\d+)/);
    const turns = turnsMatch ? parseInt(turnsMatch[1], 10) : null;

    const costMatch = metaLine.match(/Cost:\s*\$?(\d+\.\d+)/);
    const cost = costMatch ? parseFloat(costMatch[1]) : null;

    // ADR-018: Inferred baseline from git history
    let createdAt = this.creationDateMap.get(filePath) || null;
    
    // Graded Integrity logic
    let integrity: ArchivedTaskMetrics['integrity'] = 'HIGH';
    let provenance: EpistemicDigest | undefined;

    if (!createdAt) {
      integrity = 'LOW'; // Unverifiable history
    } else {
      // If we used git history to infer createdAt (because it's not in meta), 
      // it's MEDIUM integrity per ADR-018.
      integrity = 'MEDIUM';
      provenance = {
        methodId: 'git-history-inference-v1',
        gitRevRange: 'HEAD~1000'
      };
    }

    return {
      id,
      size,
      class: taskClass,
      completedAt,
      createdAt,
      turns,
      cost,
      integrity,
      provenance
    };
  }
}
