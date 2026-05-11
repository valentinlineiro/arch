import type { FileSystem } from '../../domain/repositories/file-system.js';

export interface CorpusMatch {
  path: string;
  hits: number;
  excerpt: string;
}

export interface AskResult {
  keywords: string[];
  matches: CorpusMatch[];
  taskRefs: string[];
  adrRefs: string[];
  principleRefs: string[];
  recurringSignals: string[];
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would',
  'could', 'should', 'may', 'might', 'can',
  'why', 'how', 'what', 'when', 'where', 'who', 'which',
  'that', 'this', 'these', 'those',
  'and', 'or', 'but', 'not', 'no',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'into',
  'its', 'it', 'my', 'our', 'their', 'we', 'i',
]);

const CORPUS_DIRS = [
  'docs/archive',
  'docs/tasks',
  'docs/adr',
  'docs/guidelines',
];

const CORPUS_FILES = [
  'docs/KAIZEN-LOG.md',
  'docs/RETRO.md',
  'docs/PRINCIPLES.md',
];

export class AskCorpus {
  constructor(
    private fileSystem: FileSystem,
    private rootPath: string,
  ) {}

  async execute(question: string): Promise<AskResult> {
    const keywords = this.tokenize(question);
    if (keywords.length === 0) {
      throw new Error('No searchable keywords in question. Add specific terms to query.');
    }

    const files = await this.collectFiles();
    const scored: Array<{ path: string; hits: number; excerpt: string; content: string }> = [];

    for (const file of files) {
      const fullPath = `${this.rootPath}/${file}`;
      let content: string;
      try {
        content = await this.fileSystem.readFile(fullPath);
      } catch {
        continue;
      }

      const lower = content.toLowerCase();
      let hits = 0;
      for (const kw of keywords) {
        let pos = 0;
        while ((pos = lower.indexOf(kw, pos)) !== -1) { hits++; pos++; }
      }
      if (hits === 0) continue;

      scored.push({ path: file, hits, excerpt: this.extractExcerpt(content, keywords), content });
    }

    scored.sort((a, b) => b.hits - a.hits);
    const top = scored.slice(0, 10);
    const topForRefs = scored.slice(0, 5);

    // Entity refs scoped to top-5 matches only to reduce noise
    const taskRefs = new Set<string>();
    const adrRefs = new Set<string>();
    const principleRefs = new Set<string>();
    for (const { content } of topForRefs) {
      for (const m of content.matchAll(/TASK-\d+/g)) taskRefs.add(m[0]);
      for (const m of content.matchAll(/ADR-\d+/g)) adrRefs.add(m[0]);
      for (const m of content.matchAll(/P-\d{3}/g)) principleRefs.add(m[0]);
    }

    // Recurring signals: task IDs appearing in 3+ of the top-10 matches
    const taskIdCount = new Map<string, number>();
    for (const { content } of top) {
      const seen = new Set<string>();
      for (const m of content.matchAll(/TASK-\d+/g)) {
        if (!seen.has(m[0])) { seen.add(m[0]); taskIdCount.set(m[0], (taskIdCount.get(m[0]) ?? 0) + 1); }
      }
    }
    const recurringSignals = [...taskIdCount.entries()]
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => `${id} (${count} matches)`);

    return {
      keywords,
      matches: top.map(({ path, hits, excerpt }) => ({ path, hits, excerpt })),
      taskRefs: [...taskRefs].sort(),
      adrRefs: [...adrRefs].sort(),
      principleRefs: [...principleRefs].sort(),
      recurringSignals,
    };
  }

  tokenize(question: string): string[] {
    return [...new Set(
      question.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3 && !STOP_WORDS.has(w)),
    )];
  }

  private async collectFiles(): Promise<string[]> {
    const files: string[] = [...CORPUS_FILES];
    for (const dir of CORPUS_DIRS) {
      try {
        const entries = await this.fileSystem.readDirectory(`${this.rootPath}/${dir}`);
        for (const entry of entries) {
          if (entry.endsWith('.md')) files.push(`${dir}/${entry}`);
        }
      } catch {
        // directory may not exist in all repos
      }
    }
    return files;
  }

  private extractExcerpt(content: string, keywords: string[]): string {
    const lines = content.split('\n');
    const hit = lines.find(l => keywords.some(kw => l.toLowerCase().includes(kw))) ?? lines[0];
    return hit.replace(/^#+\s*/, '').trim().slice(0, 120);
  }
}
