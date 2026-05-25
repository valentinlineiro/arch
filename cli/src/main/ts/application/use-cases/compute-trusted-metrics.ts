import { FileSystem } from '../../domain/repositories/file-system.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

export interface TrustedMetrics {
  completedTasks: number;
  reviewFailRate: number | 'pending';
}

/**
 * Computes the two lightweight Trusted Metrics:
 *  - completedTasks: count of .md files in the archive directory
 *  - reviewFailRate: rejections / total review exits from EVENTS.md
 *
 * This is intentionally fast: no archive scanning, no git verification.
 * Used on every task closure and govern tick. For full metrics, use arch report.
 */
export async function computeTrustedMetrics(fileSystem: FileSystem): Promise<TrustedMetrics> {
  const completedTasks = await countArchivedTasks(fileSystem);
  const reviewFailRate = await computeReviewFailRate(fileSystem);
  return { completedTasks, reviewFailRate };
}

async function countArchivedTasks(fileSystem: FileSystem): Promise<number> {
  let count = 0;
  try {
    const pr = PathResolver.from({});
    const archiveFiles = await fileSystem.readDirectory(pr.archive);
    count += archiveFiles.filter(f => f.endsWith('.md')).length;
  } catch {
    // archive may not exist yet
  }
  try {
    const pr = PathResolver.from({});
    const taskFiles = await fileSystem.readDirectory(pr.tasks);
    for (const file of taskFiles.filter(f => f.endsWith('.md'))) {
      try {
        const content = await fileSystem.readFile(`${pr.tasks}/${file}`);
        if (content.includes('| DONE |')) count++;
      } catch {
        // skip unreadable files
      }
    }
  } catch {
    // tasks dir may not exist
  }
  return count;
}

async function computeReviewFailRate(fileSystem: FileSystem): Promise<number | 'pending'> {
  try {
    const eventsPath = 'docs/EVENTS.md';
    if (!(await fileSystem.exists(eventsPath))) {
      return 'pending';
    }

    const content = await fileSystem.readFile(eventsPath);
    const lines = content.split('\n');

    let rejections = 0; // REVIEW -> READY
    let approvals = 0;  // REVIEW -> DONE

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('REVIEW -> READY')) rejections++;
      if (trimmed.includes('REVIEW -> DONE')) approvals++;
    }

    const totalExits = rejections + approvals;
    if (totalExits === 0) return 'pending';

    return rejections / totalExits;
  } catch {
    return 'pending';
  }
}
