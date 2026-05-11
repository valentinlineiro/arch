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
    const matches: CorpusMatch[] = [];
    const taskRefs = new Set<string>();
    const adrRefs = new Set<string>();
    const principleRefs = new Set<string>();

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

      const excerpt = this.extractExcerpt(content, keywords);
      matches.push({ path: file, hits, excerpt });

      for (const m of content.matchAll(/TASK-\d+/g)) taskRefs.add(m[0]);
      for (const m of content.matchAll(/ADR-\d+/g)) adrRefs.add(m[0]);
      for (const m of content.matchAll(/P-\d{3}/g)) principleRefs.add(m[0]);
    }

    matches.sort((a, b) => b.hits - a.hits);

    return {
      keywords,
      matches: matches.slice(0, 10),
      taskRefs: [...taskRefs].sort(),
      adrRefs: [...adrRefs].sort(),
      principleRefs: [...principleRefs].sort(),
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
