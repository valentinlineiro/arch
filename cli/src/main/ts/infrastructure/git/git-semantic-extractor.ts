
import { execSync } from 'node:child_process';
import type { GitDiffChunk } from '../../domain/models/audit-inference.js';

export class GitSemanticExtractor {
  constructor(private repoPath: string) {}

  async extractChunks(options: { maxCommits?: number; since?: string } = {}): Promise<GitDiffChunk[]> {
    const maxCommits = options.maxCommits ?? 200;
    const sinceArg = options.since ? `${options.since}..HEAD` : `-${maxCommits}`;
    const chunks: GitDiffChunk[] = [];

    // Use --patch to get diffs, --numstat to get summary of changes
    // Custom format to get commit hash and timestamp clearly
    const raw = this.git(
      `log --format="COMMIT:%H|%at" --patch --numstat ${sinceArg}`
    );

    let currentCommit: string | null = null;
    let currentTimestamp: number | null = null;
    let currentFile: string | null = null;
    let addedLines: string[] = [];
    let removedLines: string[] = [];

    const lines = raw.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('COMMIT:')) {
        this.pushChunk(chunks, currentCommit, currentTimestamp, currentFile, addedLines, removedLines);
        
        const [hash, timestamp] = line.slice(7).split('|');
        currentCommit = hash;
        currentTimestamp = parseInt(timestamp, 10) * 1000; // to ms
        currentFile = null;
        addedLines = [];
        removedLines = [];
        continue;
      }

      if (line.startsWith('diff --git')) {
        this.pushChunk(chunks, currentCommit, currentTimestamp, currentFile, addedLines, removedLines);
        
        // Extract file path from "diff --git a/file b/file"
        const match = line.match(/b\/(.+)$/);
        currentFile = match ? match[1] : null;
        addedLines = [];
        removedLines = [];
        continue;
      }

      if (currentFile) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          addedLines.push(line.slice(1));
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          removedLines.push(line.slice(1));
        }
      }
    }

    this.pushChunk(chunks, currentCommit, currentTimestamp, currentFile, addedLines, removedLines);

    return chunks;
  }

  private pushChunk(
    chunks: GitDiffChunk[],
    commit: string | null,
    timestamp: number | null,
    file: string | null,
    added: string[],
    removed: string[]
  ) {
    if (commit && timestamp && file && (added.length > 0 || removed.length > 0)) {
      chunks.push({
        commit,
        timestamp,
        file,
        addedLines: [...added],
        removedLines: [...removed]
      });
    }
  }

  private git(cmd: string): string {
    try {
      return execSync(`git -C "${this.repoPath}" ${cmd}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 500 * 1024 * 1024, // 500MB buffer for large patches
      });
    } catch {
      return '';
    }
  }
}
