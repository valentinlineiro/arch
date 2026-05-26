import { FileSystem } from '../repositories/file-system.js';
import { GitRepository } from '../repositories/git-repository.js';
import { EpistemicDigest } from '../models/provenance.js';
import path from 'node:path';
import { PathResolver } from './path-resolver.js';

export interface ArchivedTaskMetrics {
  id: string;
  size: string;
  class: string;
  completedAt: string | null;
  createdAt: string | null;
  turns: number | null;
  cost: number | null;
  costSource?: 'real' | 'heuristic';
  integrity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INVALID';
  provenance?: EpistemicDigest;
  hanseiSeverity?: string;
  hanseiCategory?: string;
  actor?: string;
}

export class ArchiveParser {
  private creationDateMap: Map<string, string> = new Map();
  private completionDateMap: Map<string, string> = new Map();

  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository
  ) {}

  async parseArchivedTasks(): Promise<ArchivedTaskMetrics[]> {
    const archiveDir = PathResolver.from({}).archive;
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
      const metaMatch = content.match(/\*\*Meta:\*\*\s*(.+)/);
      if (!metaMatch) continue;
      const metaFields = metaMatch[1].split('|').map(f => f.trim());
      const knownStatuses = new Set(['DONE', 'READY', 'IN_PROGRESS', 'REVIEW', 'BLOCKED']);
      const statusField = metaFields.find(f => knownStatuses.has(f));
      if (statusField !== 'DONE') continue;

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
          const paths = PathResolver.from({});
          if (normalizedPath.startsWith(path.normalize(paths.archive + '/')) && normalizedOldPath.startsWith(path.normalize(paths.tasks + '/'))) {
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
          // Both agree — reinforce integrity
          if (integrity !== 'HIGH') integrity = 'MEDIUM';
        } else {
          // Timestamps disagree: either Auditor wrote Closed-at before or after arch govern moved
          // the file (both are legitimate two-step workflow sequences). Degrade to LOW — uncertain
          // but not a constitutional violation. INVALID reserved for structural impossibilities.
          integrity = 'LOW';
          provenance = { methodId: 'completion-timestamp-discrepancy', gitRevRange: 'HEAD' };
        }
      } else {
        // No git move event found (maybe manual write_file instead of git mv)
        // Degrade to LOW because we can't verify the claim
        integrity = integrity === 'HIGH' ? 'MEDIUM' : 'LOW';
      }
    } else if (gitClosedAt) {
      completedAt = gitClosedAt;
      if ((integrity as string) !== 'INVALID') integrity = 'MEDIUM';
      provenance = { methodId: 'git-archive-move-inference', gitRevRange: 'HEAD' };
    }

    // Parse Hansei fields and Actor for signal routing and reporting
    const hanseiSeverityMatch = content.match(/\*\*Severity:\*\*\s*(H[0-3][ab]?)/);
    const hanseiCategoryMatch = content.match(/\*\*Category:\*\*\s*(\[\w+\])/);
    const actorMatch = content.match(/\*\*Actor:\*\*\s*([^\n]+)/);

    // Override heuristic cost with real data from costs/ directory if available
    let finalCost: number | null = cost;
    let costSource: 'real' | 'heuristic' = 'heuristic';
    try {
      const costJson = await this.fileSystem.readFile(`${PathResolver.from({}).archDir}/costs/${id}.json`);
      const costData = JSON.parse(costJson);
      if (typeof costData.estimatedCostUSD === 'number') {
        finalCost = costData.estimatedCostUSD;
        costSource = 'real';
      }
    } catch { /* cost file absent — use heuristic */ }

    return {
      id,
      size,
      class: taskClass,
      completedAt,
      createdAt,
      turns,
      cost: finalCost,
      costSource,
      integrity,
      provenance,
      hanseiSeverity: hanseiSeverityMatch?.[1],
      hanseiCategory: hanseiCategoryMatch?.[1],
      actor: actorMatch?.[1]?.trim(),
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

  // Returns true only if claimed timestamp is AFTER the git move (backdating).
  // Auditor-before-govern (claimed < git move) is the legitimate two-step workflow.
  private isBackdated(claimed: string, gitMove: string): boolean {
    try {
      return new Date(claimed).getTime() > new Date(gitMove).getTime() + 60000;
    } catch {
      return false;
    }
  }
}
