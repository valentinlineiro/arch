import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';

export interface CorpusEntry {
  id: string;
  size: string;
  class: string;
  closedAt: string | null;
  lockedCommit: string | null;
  severity: string;
  category: string;
  decision: string;
  constraint: string;
  cost: string;
  forwardAction: string;
  actor: string | null;
}

export interface CorpusIndex {
  version: number;
  builtAt: string;
  archiveCommit: string | null;
  taskCount: number;
  entries: Record<string, CorpusEntry>;
}

const INDEX_PATH = '.arch/corpus-index.json';
const ARCHIVE_DIR = 'docs/archive';
const CURRENT_VERSION = 1;

export class CorpusIndexService {
  constructor(
    private fileSystem: FileSystem,
    private gitRepository?: GitRepository,
  ) {}

  /** Load index from disk, rebuilding if stale or missing. */
  async load(): Promise<CorpusIndex> {
    const currentCommit = await this.getArchiveCommit();

    try {
      const raw = await this.fileSystem.readFile(INDEX_PATH);
      const index = JSON.parse(raw) as CorpusIndex;
      if (index.version === CURRENT_VERSION && index.archiveCommit === currentCommit) {
        return index; // Cache hit
      }
    } catch { /* missing or corrupt — rebuild */ }

    return this.rebuild(currentCommit);
  }

  /** Force rebuild the index from archive files. */
  async rebuild(archiveCommit?: string | null): Promise<CorpusIndex> {
    const commit = archiveCommit ?? await this.getArchiveCommit();
    const entries: Record<string, CorpusEntry> = {};

    let files: string[] = [];
    try { files = await this.fileSystem.readDirectory(ARCHIVE_DIR); } catch {}

    for (const file of files.filter(f => f.startsWith('TASK-') && f.endsWith('.md'))) {
      const id = file.replace('.md', '');
      try {
        const content = await this.fileSystem.readFile(`${ARCHIVE_DIR}/${file}`);
        const entry = this.parseEntry(id, content);
        if (entry) entries[id] = entry;
      } catch { /* skip unreadable */ }
    }

    const index: CorpusIndex = {
      version: CURRENT_VERSION,
      builtAt: new Date().toISOString(),
      archiveCommit: commit,
      taskCount: Object.keys(entries).length,
      entries,
    };

    try {
      await this.fileSystem.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));
    } catch { /* non-fatal — index write failure doesn't break anything */ }

    return index;
  }

  /** Invalidate: force next load() to rebuild. */
  async invalidate(): Promise<void> {
    try {
      const raw = await this.fileSystem.readFile(INDEX_PATH);
      const index = JSON.parse(raw) as CorpusIndex;
      index.archiveCommit = null;
      await this.fileSystem.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));
    } catch { /* ignore */ }
  }

  private parseEntry(id: string, content: string): CorpusEntry | null {
    const meta = content.match(/\*\*Meta:\*\*\s*(\S+)\s*\|\s*(\S+)\s*\|\s*\S+\s*\|\s*\S+\s*\|\s*(\S+)/);
    if (!meta) return null;

    const closedAt = content.match(/\*\*Closed-at:\*\*\s*(\S+)/)?.[1] ?? null;
    const lockedCommit = content.match(/\*\*Locked-commit:\*\*\s*(\S+)/)?.[1] ?? null;
    const actor = content.match(/\*\*Actor:\*\*\s*([^\n]+)/)?.[1]?.trim() ?? null;

    const idx = content.lastIndexOf('## Hansei');
    if (idx < 0) return null;
    const section = content.slice(idx);

    return {
      id,
      size: meta[2],
      class: meta[3],
      closedAt,
      lockedCommit,
      actor,
      severity: section.match(/\*\*Severity:\*\*\s*(\S+)/)?.[1] ?? '',
      category: section.match(/\*\*Category:\*\*\s*(\S+)/)?.[1] ?? '',
      decision: section.match(/\*\*Decision:\*\*\s*([\s\S]*?)(?=\n\*\*|\Z)/)?.[1]?.trim() ?? '',
      constraint: section.match(/\*\*Constraint:\*\*\s*([\s\S]*?)(?=\n\*\*|\Z)/)?.[1]?.trim() ?? '',
      cost: section.match(/\*\*Cost:\*\*\s*([\s\S]*?)(?=\n\*\*|\Z)/)?.[1]?.trim() ?? '',
      forwardAction: section.match(/\*\*Forward Action:\*\*\s*([\s\S]*?)(?=\n\*\*|\n##|$)/)?.[1]?.trim() ?? '',
    };
  }

  private async getArchiveCommit(): Promise<string | null> {
    if (!this.gitRepository) return null;
    try {
      // Use a stable signal: hash of the archive directory listing
      const files = await this.fileSystem.readDirectory(ARCHIVE_DIR);
      const listing = files.sort().join(',');
      // Simple hash — file count + last filename is a cheap freshness signal
      return `${files.length}:${files[files.length - 1] ?? ''}`;
    } catch { return null; }
  }
}
