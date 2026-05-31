import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

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
  acCount: number;
  acMachineVerifiable: number;
  closurePath: 'L3' | 'auditor' | 'unknown';
  source?: string;
}

export interface CorpusIndex {
  version: number;
  builtAt: string;
  archiveCommit: string;
  taskCount: number;
  entries: Record<string, CorpusEntry>;
}

const INDEX_PATH = PathResolver.from({}).corpusIndex;
const ARCHIVE_DIR = PathResolver.from({}).archive;
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
  async rebuild(archiveCommit?: string): Promise<CorpusIndex> {
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

  /**
   * Parse a single file into a CorpusEntry (public for import use).
   * Returns null if the file cannot be parsed (no Hansei, malformed, etc).
   */
  parseEntryPublic(id: string, content: string): CorpusEntry | null {
    return this.parseEntry(id, content);
  }

  /**
   * Merge entries tagged with a given source slug into the main corpus index.
   * Clears any existing entries with that source first (idempotent re-import).
   */
  async mergeImported(slug: string, newEntries: Record<string, CorpusEntry>): Promise<{ added: number }> {
    let index: CorpusIndex;
    try {
      const raw = await this.fileSystem.readFile(INDEX_PATH);
      index = JSON.parse(raw) as CorpusIndex;
    } catch {
      index = { version: CURRENT_VERSION, builtAt: new Date().toISOString(), archiveCommit: '', taskCount: 0, entries: {} };
    }

    // Remove existing entries for this source slug
    for (const [key, entry] of Object.entries(index.entries)) {
      if (entry.source === slug) delete index.entries[key];
    }

    // Tag and merge new entries
    for (const [key, entry] of Object.entries(newEntries)) {
      index.entries[key] = { ...entry, source: slug };
    }

    index.taskCount = Object.keys(index.entries).length;
    index.builtAt = new Date().toISOString();

    await this.fileSystem.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));
    return { added: Object.keys(newEntries).length };
  }

  /** Invalidate: force next load() to rebuild. */
  async invalidate(): Promise<void> {
    try {
      const raw = await this.fileSystem.readFile(INDEX_PATH);
      const index = JSON.parse(raw) as CorpusIndex;
      index.archiveCommit = '';  // empty string != any real commit signal → triggers rebuild
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

    // AC predicate counts
    const acSection = content.match(/### Acceptance Criteria([\s\S]*?)(?=\n###|\n##|$)/)?.[1] ?? '';
    const totalPredicates = [...acSection.matchAll(/^\s+-\s+`(cmd|file|prose):/gim)].length;
    const machinePredicates = [...acSection.matchAll(/^\s+-\s+`(cmd|file):/gim)].length;

    // Closure path
    const hasApproval = /^## Approval/m.test(content);
    const closurePath: 'L3' | 'auditor' | 'unknown' =
      hasApproval ? 'auditor' :
      (meta[2] === 'XS' || meta[2] === 'S') ? 'L3' : 'unknown';

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
      acCount: totalPredicates,
      acMachineVerifiable: machinePredicates,
      closurePath,
    };
  }

  private async getArchiveCommit(): Promise<string> {
    try {
      const files = await this.fileSystem.readDirectory(ARCHIVE_DIR);
      // Freshness signal: file count + last filename. Cheap, non-null, no git required.
      return `${files.length}:${files.sort().at(-1) ?? ''}`;
    } catch { return '0:'; }
  }

  /**
   * Sync remote ARCH repos into local corpus index.
   * Runs on govern tick when corpus.remotes is configured.
   * Non-blocking — warnings only on remote failures.
   */
  async syncRemotes(remotes: Array<{ url: string; slug?: string }>): Promise<{ synced: number; skipped: number }> {
    const { execSync } = await import('node:child_process');
    const { mkdtempSync, rmSync, existsSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');

    let synced = 0;
    let skipped = 0;

    const index = await this.load();

    for (const remote of remotes) {
      const slug = remote.slug ?? remote.url.split('/').at(-1)?.replace('.git', '') ?? 'remote';
      let tmpDir: string | null = null;

      try {
        tmpDir = mkdtempSync(join(tmpdir(), `arch-sync-${slug}-`));
        execSync(`git clone --depth 50 "${remote.url}" "${tmpDir}"`, { stdio: 'pipe', timeout: 60000 });

        // Read remote archive
        const archiveDir = join(tmpDir, 'docs', 'archive');
        if (!existsSync(archiveDir)) {
          console.log(`  ⚠ Remote ${slug}: no docs/archive/ found — skipping`);
          continue;
        }

        const { readdir, readFile } = await import('node:fs/promises');
        const files = await readdir(archiveDir).catch(() => [] as string[]);
        const taskFiles = files.filter(f => f.startsWith('TASK-') && f.endsWith('.md'));

        for (const file of taskFiles) {
          const remoteId = `${slug}:${file.replace('.md', '')}`;
          if (index.entries[remoteId]) { skipped++; continue; } // Already indexed

          const content = await readFile(join(archiveDir, file), 'utf8').catch(() => null);
          if (!content) continue;

          const entry = this.parseEntry(content, remoteId);
          if (entry) {
            index.entries[remoteId] = { ...entry, source: slug };
            synced++;
          }
        }

      } catch (err: any) {
        console.log(`  ⚠ Corpus sync failed for ${slug}: ${err.message?.slice(0, 80)}`);
      } finally {
        if (tmpDir) { try { rmSync(tmpDir, { recursive: true, force: true }); } catch {} }
      }
    }

    if (synced > 0) {
      index.taskCount = Object.keys(index.entries).length;
      index.builtAt = new Date().toISOString();
      await this.fileSystem.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));
    }

    return { synced, skipped };
  }
}
