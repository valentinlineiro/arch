import type { FileSystem } from '../../domain/repositories/file-system.js';

export type QueryClass = 'DEFINITIONAL' | 'HISTORICAL' | 'STRUCTURAL' | 'PATTERN' | 'GENERAL';

export interface CorpusMatch {
  path: string;
  score: number;
  excerpt: string;
}

export interface AskResult {
  queryClass: QueryClass;
  keywords: string[];
  answer: string | null;
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
  'docs/IDENTITY.md',
  'docs/ROADMAP.md',
  'docs/KAIZEN-LOG.md',
  'docs/RETRO.md',
  'docs/PRINCIPLES.md',
  'docs/GOVERNANCE.md',
];

// Score multipliers applied after keyword hit count, by query class and file path pattern.
// Order matters: first match wins.
const CLASS_MULTIPLIERS: Record<QueryClass, Array<{ pattern: RegExp; multiplier: number }>> = {
  DEFINITIONAL: [
    { pattern: /docs\/IDENTITY\.md$/, multiplier: 8 },
    { pattern: /docs\/ROADMAP\.md$/, multiplier: 5 },
    { pattern: /docs\/PRINCIPLES\.md$/, multiplier: 4 },
    { pattern: /docs\/GOVERNANCE\.md$/, multiplier: 4 },
    { pattern: /docs\/adr\//, multiplier: 3 },
    { pattern: /docs\/archive\//, multiplier: 0.2 },
    { pattern: /docs\/tasks\//, multiplier: 0.2 },
  ],
  HISTORICAL: [
    { pattern: /docs\/KAIZEN-LOG\.md$/, multiplier: 4 },
    { pattern: /docs\/RETRO\.md$/, multiplier: 4 },
    { pattern: /docs\/archive\//, multiplier: 3 },
    { pattern: /docs\/adr\//, multiplier: 2 },
    { pattern: /docs\/IDENTITY\.md$/, multiplier: 0.3 },
  ],
  STRUCTURAL: [
    { pattern: /docs\/adr\//, multiplier: 4 },
    { pattern: /docs\/guidelines\//, multiplier: 3 },
    { pattern: /docs\/tasks\//, multiplier: 2 },
    { pattern: /docs\/archive\//, multiplier: 1.5 },
  ],
  PATTERN: [
    { pattern: /docs\/KAIZEN-LOG\.md$/, multiplier: 5 },
    { pattern: /docs\/RETRO\.md$/, multiplier: 4 },
    { pattern: /docs\/PRINCIPLES\.md$/, multiplier: 3 },
    { pattern: /docs\/archive\//, multiplier: 2 },
    { pattern: /docs\/adr\//, multiplier: 1.5 },
  ],
  GENERAL: [],
};

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

    const queryClass = this.classifyQuery(question);
    const files = await this.collectFiles();
    const scored: Array<{ path: string; score: number; excerpt: string; content: string }> = [];

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

      const multiplier = this.getMultiplier(queryClass, file);
      const score = hits * multiplier;
      scored.push({ path: file, score, excerpt: this.extractExcerpt(content, keywords), content });
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 10);
    const topForRefs = scored.slice(0, 5);

    const taskRefs = new Set<string>();
    const adrRefs = new Set<string>();
    const principleRefs = new Set<string>();
    for (const { content } of topForRefs) {
      for (const m of content.matchAll(/TASK-\d+/g)) taskRefs.add(m[0]);
      for (const m of content.matchAll(/ADR-\d+/g)) adrRefs.add(m[0]);
      for (const m of content.matchAll(/P-\d{3}/g)) principleRefs.add(m[0]);
    }

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

    const answer = queryClass === 'DEFINITIONAL'
      ? await this.extractDefinitionalAnswer()
      : null;

    return {
      queryClass,
      keywords,
      answer,
      matches: top.map(({ path, score, excerpt }) => ({ path, score, excerpt })),
      taskRefs: [...taskRefs].sort(),
      adrRefs: [...adrRefs].sort(),
      principleRefs: [...principleRefs].sort(),
      recurringSignals,
    };
  }

  classifyQuery(question: string): QueryClass {
    const q = question.toLowerCase();
    if (/\b(what is|what are|what('s| is) the (point|purpose|goal)|why (does|do) (this|it) exist|what does .* do|why exist|define|definition)\b/.test(q)) {
      return 'DEFINITIONAL';
    }
    if (/\b(why did|when did|what caused|what went wrong|history of|fail(ed|ure)?|broke|broke down|incident)\b/.test(q)) {
      return 'HISTORICAL';
    }
    if (/\b(where is|where (does|do)|which file|how is .* defined|where (can i find|are))\b/.test(q)) {
      return 'STRUCTURAL';
    }
    if (/\b(what keeps|why (does|do) .* keep|pattern|recurring|always|every time|repeatedly|keeps (happening|failing))\b/.test(q)) {
      return 'PATTERN';
    }
    return 'GENERAL';
  }

  tokenize(question: string): string[] {
    return [...new Set(
      question.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3 && !STOP_WORDS.has(w)),
    )];
  }

  private getMultiplier(queryClass: QueryClass, filePath: string): number {
    for (const { pattern, multiplier } of CLASS_MULTIPLIERS[queryClass]) {
      if (pattern.test(filePath)) return multiplier;
    }
    return 1;
  }

  private async extractDefinitionalAnswer(): Promise<string | null> {
    try {
      const content = await this.fileSystem.readFile(`${this.rootPath}/docs/IDENTITY.md`);
      // Extract the definition block: lines after "## 1. Definition" up to the next heading
      const lines = content.split('\n');
      const start = lines.findIndex(l => /^##\s+1\.\s+Definition/i.test(l));
      if (start === -1) return null;
      const end = lines.findIndex((l, i) => i > start && /^##/.test(l));
      const block = (end === -1 ? lines.slice(start + 1) : lines.slice(start + 1, end))
        .filter(l => l.trim() && !l.startsWith('<!--') && l.trim() !== '---')
        .join(' ')
        .replace(/>\s*/g, '')
        .replace(/\*\*/g, '')
        .trim();
      return block.slice(0, 300) || null;
    } catch {
      return null;
    }
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
