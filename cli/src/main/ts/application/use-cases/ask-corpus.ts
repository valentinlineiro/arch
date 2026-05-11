import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { CausalGraph } from './causal-graph.js';

export type QueryClass = 'DEFINITIONAL' | 'HISTORICAL' | 'STRUCTURAL' | 'PATTERN' | 'GENERAL';

export interface CorpusMatch {
  path: string;
  score: number;
  excerpt: string;
  reasons: string[];
}

export interface CauseGroup {
  token: string;
  count: number;
  taskIds: string[];
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
  causeGroups: CauseGroup[];
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
    private causalGraph?: CausalGraph,
  ) {}

  async execute(question: string): Promise<AskResult> {
    const keywords = this.tokenize(question);
    if (keywords.length === 0) {
      throw new Error('No searchable keywords in question. Add specific terms to query.');
    }

    const queryClass = this.classifyQuery(question);
    const queryEntities = this.extractQueryEntities(question);
    const files = await this.collectFiles();
    const scored: Array<{ path: string; score: number; excerpt: string; reasons: string[]; content: string }> = [];

    for (const file of files) {
      const fullPath = `${this.rootPath}/${file}`;
      let content: string;
      try {
        content = await this.fileSystem.readFile(fullPath);
      } catch {
        continue;
      }

      const lower = content.toLowerCase();
      const kwHits = new Map<string, number>();
      for (const kw of keywords) {
        let count = 0, pos = 0;
        while ((pos = lower.indexOf(kw, pos)) !== -1) { count++; pos++; }
        if (count > 0) kwHits.set(kw, count);
      }
      if (kwHits.size === 0) continue;

      const totalHits = [...kwHits.values()].reduce((a, b) => a + b, 0);
      const multiplier = this.getMultiplier(queryClass, file);
      const causalMultiplier = this.causalGraph && queryEntities.length > 0
        ? await this.causalGraph.causalRelevance(this.extractCandidateEntity(file) ?? '', queryEntities)
        : 1.0;
      const score = totalHits * multiplier * causalMultiplier;
      const reasons = this.buildReasons(kwHits, multiplier, file, content);
      if (causalMultiplier > 1.0) reasons.push(`causal ×${causalMultiplier.toFixed(2)}`);
      scored.push({ path: file, score, excerpt: this.extractExcerpt(content, keywords), reasons, content });
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

    const causeGroups = this.buildCauseGroups(top, keywords);

    const answer = queryClass === 'DEFINITIONAL'
      ? await this.extractDefinitionalAnswer()
      : null;

    return {
      queryClass,
      keywords,
      answer,
      matches: top.map(({ path, score, excerpt, reasons }) => ({ path, score, excerpt, reasons })),
      taskRefs: [...taskRefs].sort(),
      adrRefs: [...adrRefs].sort(),
      principleRefs: [...principleRefs].sort(),
      recurringSignals,
      causeGroups,
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

  private buildReasons(kwHits: Map<string, number>, multiplier: number, filePath: string, content: string): string[] {
    const reasons: string[] = [];

    const kwParts = [...kwHits.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([kw, n]) => `${kw} ×${n}`);
    reasons.push(`keywords: ${kwParts.join(', ')}`);

    if (multiplier !== 1) {
      const dir = multiplier >= 1 ? 'boost' : 'suppressed';
      const tag = filePath.includes('/archive/') ? 'archive'
        : filePath.includes('/adr/') ? 'ADR'
        : filePath.includes('/tasks/') ? 'tasks'
        : filePath.includes('/guidelines/') ? 'guidelines'
        : filePath.split('/').pop()!.replace('.md', '');
      reasons.push(`${tag} ${multiplier}× ${dir}`);
    }

    const adrRefs = [...new Set(content.match(/ADR-\d+/g) ?? [])].slice(0, 3);
    if (adrRefs.length > 0) reasons.push(`refs ${adrRefs.join(', ')}`);

    return reasons;
  }

  private buildCauseGroups(
    top: Array<{ path: string; content: string }>,
    queryKeywords: string[],
  ): CauseGroup[] {
    const FAILURE_SIGNALS = /\b(fail|reject|block|miss|incomplete|error|broke|issue|gap|stuck|stale|delay)/i;
    // Structural tokens that appear in every archive file — no causal signal
    const NOISE = new Set(['task', 'tasks', 'arch', 'docs', 'file', 'files', 'code', 'work', 'item', 'done', 'meta', 'focus', 'context', 'section', 'content', 'archive', 'review', 'result', 'results', 'output', 'status', 'update', 'change', 'changes']);
    const queryKwSet = new Set(queryKeywords);
    const tokenToTasks = new Map<string, Set<string>>();

    for (const { path, content } of top) {
      if (!path.includes('/archive/') && !path.includes('/tasks/')) continue;
      const taskId = path.match(/TASK-\d+/)?.[0];
      if (!taskId) continue;

      const failureLines = content.split('\n').filter(l => FAILURE_SIGNALS.test(l));
      if (failureLines.length === 0) continue;

      // Also exclude tokens that are derived forms of query keywords (e.g. 'failures' from 'fail')
      const tokens = this.tokenize(failureLines.join(' '))
        .filter(t => !queryKwSet.has(t) && !NOISE.has(t) && t.length >= 5
          && ![...queryKwSet].some(kw => t.startsWith(kw)));
      for (const token of tokens) {
        if (!tokenToTasks.has(token)) tokenToTasks.set(token, new Set());
        tokenToTasks.get(token)!.add(taskId);
      }
    }

    return [...tokenToTasks.entries()]
      .filter(([, tasks]) => tasks.size >= 2)
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 5)
      .map(([token, tasks]) => ({ token, count: tasks.size, taskIds: [...tasks].sort() }));
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

  private extractQueryEntities(question: string): string[] {
    return [...new Set([
      ...(question.match(/TASK-\d+/g) ?? []),
      ...(question.match(/ADR-\d+/g) ?? []),
    ])];
  }

  private extractCandidateEntity(filePath: string): string | null {
    const m = filePath.match(/(TASK-\d+|ADR-\d+)/);
    return m ? m[1] : null;
  }

  private extractExcerpt(content: string, keywords: string[]): string {
    const lines = content.split('\n');
    const hasKw = (s: string) => keywords.some(kw => s.toLowerCase().includes(kw));

    // Prefer: first content line after a heading that contains a keyword
    for (let i = 0; i < lines.length; i++) {
      if (/^#+\s/.test(lines[i]) && hasKw(lines[i])) {
        const next = lines.slice(i + 1).find(l => l.trim() && !/^#+\s/.test(l));
        if (next) return next.replace(/^[>*-]\s*/, '').trim().slice(0, 120);
      }
    }

    // Fallback: first non-heading keyword-matching line
    const hit = lines.find(l => !/^#+\s/.test(l) && hasKw(l));
    if (hit) return hit.replace(/^[>*-]\s*/, '').trim().slice(0, 120);

    // Last resort: first non-blank line
    return (lines.find(l => l.trim()) ?? lines[0]).replace(/^#+\s*/, '').trim().slice(0, 120);
  }
}
