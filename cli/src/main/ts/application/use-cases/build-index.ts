import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { ContextIndex, FileEntry, AdrEntry, GuidelineEntry, TaskEntry } from '../../domain/models/context-index.js';

const GIT_LOG_DEPTH = 500;
const MAX_COMMIT_REFS = 20;

export function normalizeCommits(
  commits: Array<{ hash: string; message: string; date: string; files: string[] }>
): Array<{ taskIds: string[]; hash: string; date: string; files: string[] }> {
  return commits.map(c => ({
    taskIds: [...new Set((c.message.match(/TASK-\d+/g) ?? []))],
    hash: c.hash,
    date: c.date,
    files: c.files,
  }));
}

export class BuildIndex {
  private readonly indexPath = '.arch/context-index.json';
  private readonly srcRoot = 'cli/src/main/ts';
  private readonly adrDir = 'docs/adr';
  private readonly stopwords = new Set([
    'the', 'a', 'an', 'is', 'are', 'in', 'of', 'to', 'and', 'for', 'that',
    'this', 'it', 'not', 'as', 'at', 'by', 'or', 'be', 'do', 'if', 'on',
    'we', 'so', 'can', 'its', 'all', 'with', 'but', 'use', 'new', 'from',
    'has', 'have', 'was', 'were', 'will', 'one', 'two', 'each', 'any',
  ]);

  constructor(private fileSystem: FileSystem) {}

  async execute(
    contextRules: Record<string, { taskClasses: string[] }>,
    gitRepository: GitRepository,
  ): Promise<void> {
    const fileEntries = await this.buildFileIndex();
    const adrs = await this.buildAdrIndex();
    const guidelines = this.buildGuidelineIndex(contextRules);
    const tasks = await this.buildTaskIndex(gitRepository);

    const index: ContextIndex = {
      version: 2,
      builtAt: new Date().toISOString(),
      files: fileEntries,
      adrs,
      guidelines,
      tasks,
    };

    await this.fileSystem.mkdir('.arch');
    await this.fileSystem.writeFile(this.indexPath, JSON.stringify(index, null, 2) + '\n');
  }

  private async buildTaskIndex(git: GitRepository): Promise<Record<string, TaskEntry>> {
    const rawCommits = await git.getCommitHistory(GIT_LOG_DEPTH);
    const normalized = normalizeCommits(rawCommits);

    const entries: Record<string, TaskEntry> = {};
    for (const { taskIds, hash, date, files } of normalized) {
      for (const id of taskIds) {
        if (!entries[id]) {
          entries[id] = {
            commitCount: 0,
            lastCommitDate: date,
            touchedFrequency: {},
            recentCommitRefs: [],
            commitRefOverflow: false,
          };
        }
        const entry = entries[id];
        entry.commitCount++;
        if (date > entry.lastCommitDate) entry.lastCommitDate = date;
        for (const file of files) {
          entry.touchedFrequency[file] = (entry.touchedFrequency[file] ?? 0) + 1;
        }
        if (entry.recentCommitRefs.length < MAX_COMMIT_REFS) {
          entry.recentCommitRefs.push(hash);
        } else {
          entry.commitRefOverflow = true;
        }
      }
    }

    return entries;
  }

  private async buildFileIndex(): Promise<Record<string, FileEntry>> {
    const tsFiles = await this.findTsFiles(this.srcRoot);
    const entries: Record<string, FileEntry> = {};

    for (const filePath of tsFiles) {
      entries[filePath] = await this.extractFileEntry(filePath);
    }

    const depths = this.computeImportDepths(entries, `${this.srcRoot}/index.ts`);
    for (const [filePath, depth] of Object.entries(depths)) {
      if (entries[filePath]) {
        entries[filePath].runtimeUsage = depth <= 2 ? 'hot' : depth <= 4 ? 'warm' : 'cold';
      }
    }

    return entries;
  }

  private async findTsFiles(dir: string): Promise<string[]> {
    const result: string[] = [];
    const skip = new Set(['node_modules', 'dist', '.git', 'test']);
    let entries: string[];
    try {
      entries = await this.fileSystem.readDirectory(dir);
    } catch {
      return result;
    }
    for (const entry of entries) {
      if (skip.has(entry)) continue;
      const fullPath = `${dir}/${entry}`;
      if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
        result.push(fullPath);
      } else if (!entry.includes('.')) {
        result.push(...await this.findTsFiles(fullPath));
      }
    }
    return result;
  }

  private async extractFileEntry(filePath: string): Promise<FileEntry> {
    let content = '';
    try {
      content = await this.fileSystem.readFile(filePath);
    } catch {
      return { symbols: [], imports: [], tags: [], criticality: 'utility', runtimeUsage: 'cold' };
    }
    const symbols = this.extractSymbols(content);
    const imports = this.extractImports(content, filePath);
    const tags = this.extractTags(filePath, symbols);
    const criticality = this.inferCriticality(filePath);
    return { symbols, imports, tags, criticality, runtimeUsage: 'cold' };
  }

  extractSymbols(content: string): string[] {
    const pattern = /export\s+(?:abstract\s+)?(?:class|function|interface|type|enum|const|default\s+class)\s+(\w+)/g;
    return [...new Set([...content.matchAll(pattern)].map(m => m[1]))];
  }

  extractImports(content: string, filePath: string): string[] {
    const dir = filePath.split('/').slice(0, -1).join('/');
    const pattern = /from\s+['"](\.[^'"]+)['"]/g;
    const results: string[] = [];
    for (const match of content.matchAll(pattern)) {
      const raw = match[1].replace(/\.js$/, '');
      const segments = `${dir}/${raw}`.split('/');
      const resolved: string[] = [];
      for (const seg of segments) {
        if (seg === '..') resolved.pop();
        else if (seg !== '.') resolved.push(seg);
      }
      results.push(resolved.join('/') + '.ts');
    }
    return [...new Set(results)];
  }

  extractTags(filePath: string, symbols: string[]): string[] {
    const tags = new Set<string>();
    const relative = filePath.replace(`${this.srcRoot}/`, '');
    const segments = relative.split('/');
    for (const seg of segments.slice(0, -1)) {
      const words = seg.split('-').filter(w => w.length >= 4);
      words.forEach(w => tags.add(w.toLowerCase()));
    }
    const filename = segments[segments.length - 1].replace('.ts', '');
    filename.split('-').filter(w => w.length >= 4).forEach(w => tags.add(w.toLowerCase()));
    for (const symbol of symbols) {
      this.splitCamelCase(symbol)
        .filter(w => w.length >= 4)
        .forEach(w => tags.add(w.toLowerCase()));
    }
    return [...tags];
  }

  inferCriticality(filePath: string): 'core' | 'domain' | 'support' | 'utility' {
    if (filePath.includes('/domain/')) return 'core';
    if (filePath.includes('/application/')) return 'domain';
    if (filePath.includes('/infrastructure/')) return 'support';
    return 'utility';
  }

  computeImportDepths(entries: Record<string, FileEntry>, entryPoint: string): Record<string, number> {
    const depths: Record<string, number> = {};
    const queue: Array<[string, number]> = [[entryPoint, 0]];
    while (queue.length > 0) {
      const [file, depth] = queue.shift()!;
      if (depths[file] !== undefined) continue;
      depths[file] = depth;
      const entry = entries[file];
      if (entry) {
        for (const imp of entry.imports) {
          if (depths[imp] === undefined) queue.push([imp, depth + 1]);
        }
      }
    }
    return depths;
  }

  private async buildAdrIndex(): Promise<Record<string, AdrEntry>> {
    const adrs: Record<string, AdrEntry> = {};
    let files: string[];
    try {
      files = await this.fileSystem.readDirectory(this.adrDir);
    } catch {
      return adrs;
    }
    for (const file of files) {
      const match = file.match(/^(ADR-\d+)/);
      if (!match || !file.endsWith('.md')) continue;
      const adrId = match[1];
      try {
        const content = await this.fileSystem.readFile(`${this.adrDir}/${file}`);
        adrs[adrId] = this.parseAdr(content);
      } catch { /* skip unreadable ADRs */ }
    }
    return adrs;
  }

  parseAdr(content: string): AdrEntry {
    const titleMatch = content.match(/^#\s+ADR-\d+[:\s]+(.+)$/m);
    const title = titleMatch?.[1]?.trim() ?? '';
    const statusMatch =
      content.match(/\*\*Status:\*\*\s+(\w+)/) ??
      content.match(/##\s+Status\s*\n+(\w+)/);
    const strength: 'enforced' | 'advisory' = statusMatch?.[1] === 'ACCEPTED' ? 'enforced' : 'advisory';
    const firstSection = content.slice(0, 1000);
    const keywords = this.extractKeywords(title + ' ' + firstSection);
    const pathMatches = [...content.matchAll(/`(cli\/[^`]+\.ts)`/g)];
    const affectedModules = [...new Set(pathMatches.map(m => m[1]))];
    return { title, keywords, affectedModules, strength };
  }

  buildGuidelineIndex(contextRules: Record<string, { taskClasses: string[] }>): Record<string, GuidelineEntry> {
    const guidelines: Record<string, GuidelineEntry> = {};
    for (const [file, rule] of Object.entries(contextRules)) {
      const tags = file.replace('.md', '').split('-').filter(w => w.length >= 4);
      guidelines[file] = { tags, taskClasses: rule.taskClasses };
    }
    return guidelines;
  }

  extractKeywords(text: string): string[] {
    return [...new Set(
      text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !this.stopwords.has(w))
    )];
  }

  private splitCamelCase(s: string): string[] {
    return s.replace(/([A-Z])/g, ' $1').trim().split(/\s+/);
  }
}
