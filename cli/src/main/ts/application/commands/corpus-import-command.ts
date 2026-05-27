import * as fmt from '../../infrastructure/cli/output-formatter.js';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Command } from '../../domain/models/command.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { CorpusIndexService, type CorpusEntry } from '../use-cases/corpus-index.js';

const URL_PATTERN = /^https?:\/\//;

export class CorpusImportCommand implements Command {
  constructor(private fileSystem: FileSystem) {}

  async execute(args: string[]): Promise<number> {
    const source = args[0];
    if (!source) {
      fmt.log('Usage: arch corpus import <path|url> [--as <slug>]');
      return 1;
    }

    // Parse --as <slug>
    const asIdx = args.indexOf('--as');
    const explicitSlug = asIdx >= 0 ? args[asIdx + 1] : undefined;

    let repoPath: string;
    let tmpDir: string | undefined;

    if (URL_PATTERN.test(source)) {
      // Clone to temp dir
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-import-'));
      fmt.log(`  Cloning ${source}...`);
      const result = spawnSync('git', ['clone', '--depth', '1', source, tmpDir], { stdio: 'inherit' });
      if (result.status !== 0) {
        fmt.log(`  Error: git clone failed (exit ${result.status ?? 'unknown'})`);
        try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
        return 1;
      }
      repoPath = tmpDir;
    } else {
      repoPath = path.resolve(source);
    }

    const slug = explicitSlug ?? path.basename(repoPath);

    try {
      const { added } = await this.importFromPath(repoPath, slug);
      fmt.log(`  \x1b[32m✔\x1b[0m Imported ${added} entries from ${repoPath} → source:${slug}`);
    } finally {
      if (tmpDir) {
        try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
      }
    }

    return 0;
  }

  private async importFromPath(repoPath: string, slug: string): Promise<{ added: number }> {
    const indexService = new CorpusIndexService(this.fileSystem);
    const entries: Record<string, CorpusEntry> = {};

    // Import docs/archive/TASK-*.md
    const archiveDir = path.join(repoPath, 'docs', 'archive');
    await this.importDirectory(archiveDir, /^TASK-.*\.md$/, entries, indexService);

    // Import docs/adr/ADR-*.md — parse as synthetic corpus entries if they parse
    const adrDir = path.join(repoPath, 'docs', 'adr');
    await this.importDirectory(adrDir, /^ADR-.*\.md$/, entries, indexService);

    return indexService.mergeImported(slug, entries);
  }

  private async importDirectory(
    dir: string,
    pattern: RegExp,
    entries: Record<string, CorpusEntry>,
    indexService: CorpusIndexService,
  ): Promise<void> {
    let files: string[];
    try {
      files = fs.readdirSync(dir);
    } catch {
      return; // directory missing — skip silently
    }

    for (const file of files.filter(f => pattern.test(f))) {
      const id = file.replace('.md', '');
      try {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        const entry = indexService.parseEntryPublic(id, content);
        if (entry) entries[id] = entry;
      } catch { /* skip unreadable */ }
    }
  }
}
