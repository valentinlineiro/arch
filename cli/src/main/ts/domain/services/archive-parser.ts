import { FileSystem } from '../repositories/file-system.js';
import { GitRepository } from '../repositories/git-repository.js';
import { EpistemicDigest } from '../models/provenance.js';
import path from 'node:path';

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
  private completionDateMap: Map<string, string> = new Map();

  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository
  ) {}

  async parseArchivedTasks(): Promise<ArchivedTaskMetrics[]> {
    const archiveDir = 'docs/archive';
    if (!(await this.fileSystem.exists(archiveDir))) {
      return [];
    }

    // Severity 3: Scalable Git Ops - Single pass to map all lifecycle events
    await this.warmLifecycleMaps();

    const files = await this.fileSystem.readDirectory(archiveDir);
    const taskFiles = files.filter(f => f.startsWith('TASK-') && f.endsWith('.md'));

    const metrics: ArchivedTaskMetrics[] = [];

    for (const file of taskFiles) {
      const filePath = path.normalize(path.join(archiveDir, file));
      const content = await this.fileSystem.readFile(filePath);
      
      const metric = await this.parseTaskContent(file.replace('.md', ''), content, filePath);
      metrics.push(metric);
    }

    return metrics;
  }

  private async warmLifecycleMaps(): Promise<void> {
    const limit = 2000;
    const commits = await this.gitRepository.getCommitHistory(limit);

    // Commits are newest first. Iterate oldest to newest to follow life cycle.
    const birthDates: Map<string, string> = new Map();
    const completionDates: Map<string, string> = new Map();

    for (let i = commits.length - 1; i >= 0; i--) {
      const commit = commits[i];
      for (const file of commit.files) {
        const normalizedPath = path.normalize(file.path);
        if (file.status === 'A') {
          // Birth
          if (!birthDates.has(normalizedPath)) {
            birthDates.set(normalizedPath, commit.date);
          }
        } else if (file.status.startsWith('R') && file.oldPath) {
          // Rename: new path inherits birth date of old path
          const normalizedOldPath = path.normalize(file.oldPath);
          const birthDate = birthDates.get(normalizedOldPath);
          if (birthDate) {
            birthDates.set(normalizedPath, birthDate);
          } else {
            birthDates.set(normalizedPath, commit.date);
          }

          // Special case: Move to archive is a completion signal
          if (normalizedPath.startsWith(path.normalize('docs/archive/')) && normalizedOldPath.startsWith(path.normalize('docs/tasks/'))) {
            completionDates.set(normalizedPath, commit.date);
          }
        }
      }
    }

    this.creationDateMap = birthDates;
    this.completionDateMap = completionDates;
  }

  private async parseTaskContent(id: string, content: string, filePath: string): Promise<ArchivedTaskMetrics> {
    const metaMatch = content.match(/\*\*Meta:\*\*\s*(.+)/);
    const metaLine = metaMatch ? metaMatch[1] : '';
    const metaParts = metaLine.split('|').map(p => p.trim());

    const size = metaParts[1] || 'Unknown';
    const taskClass = metaParts[4] || 'Unknown';

    const closedAtMatch = content.match(/\*\*Closed-at:\*\*\s*([^\s\*]+)/) || content.match(/Closed-at:\s*([^\s\*]+)/);
    const metaClosedAt = closedAtMatch ? closedAtMatch[1] : null;

    const createdAtMatch = content.match(/\*\*Created-at:\*\*\s*([^\s\*]+)/) || content.match(/Created-at:\s*([^\s\*]+)/);
    const metaCreatedAt = createdAtMatch ? createdAtMatch[1] : null;

    const turnsMatch = metaLine.match(/Turns:\s*(\d+)/);
    const turns = turnsMatch ? parseInt(turnsMatch[1], 10) : null;

    const costMatch = metaLine.match(/Cost:\s*\$?(\d+\.\d+)/);
    const cost = costMatch ? parseFloat(costMatch[1]) : null;

    const normalizedFilePath = path.normalize(filePath);
    const gitBirthAt = this.creationDateMap.get(normalizedFilePath) || null;
    const gitClosedAt = this.completionDateMap.get(normalizedFilePath) || null;
    
    let createdAt: string | null = null;
    let completedAt: string | null = null;
    let integrity: ArchivedTaskMetrics['integrity'] = 'LOW';
    let provenance: EpistemicDigest | undefined;

    // Resolve Creation Date
    if (metaCreatedAt) {
      createdAt = metaCreatedAt;
      if (gitBirthAt && this.isSameTime(metaCreatedAt, gitBirthAt)) {
        integrity = 'HIGH';
      } else if (gitBirthAt) {
        // Discrepancy (Corruption if significant?)
        integrity = 'MEDIUM';
        provenance = { methodId: 'git-creation-discrepancy', gitRevRange: 'HEAD' };
      } else {
        integrity = 'MEDIUM'; // Missing evidence in git range
      }
    } else if (gitBirthAt) {
      createdAt = gitBirthAt;
      integrity = 'MEDIUM';
      provenance = { methodId: 'git-history-inference-v2', gitRevRange: 'HEAD' };
    }

    // Resolve Completion Date (Severity 2: Truth Anchors)
    if (metaClosedAt) {
      completedAt = metaClosedAt;
      if (gitClosedAt) {
        if (this.isSameTime(metaClosedAt, gitClosedAt)) {
          // Both agree, reinforce integrity if not already HIGH
          if (integrity !== 'HIGH') integrity = 'MEDIUM';
        } else {
          // EPIDEMIC FRAUD: Markdown claim contradicts immutable git move event
          integrity = 'INVALID';
          provenance = { methodId: 'completion-timestamp-forgery-detected', gitRevRange: 'HEAD' };
        }
      } else {
        // No git move event found (maybe manual write_file instead of git mv)
        // Degrade to LOW because we can't verify the claim
        integrity = integrity === 'HIGH' ? 'MEDIUM' : 'LOW';
      }
    } else if (gitClosedAt) {
      completedAt = gitClosedAt;
      if (integrity !== 'INVALID') integrity = 'MEDIUM';
      provenance = { methodId: 'git-archive-move-inference', gitRevRange: 'HEAD' };
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

  private isSameTime(t1: string, t2: string): boolean {
    try {
      const d1 = new Date(t1).getTime();
      const d2 = new Date(t2).getTime();
      // Allow 60s tolerance for clock skew/git commit delays
      return Math.abs(d1 - d2) < 60000;
    } catch {
      return false;
    }
  }
}
