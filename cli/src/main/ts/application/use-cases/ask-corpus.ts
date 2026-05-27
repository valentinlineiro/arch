import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { CausalGraph } from './causal-graph.js';
import type { TemporalIndex, TemporalSpike } from './temporal-index.js';
import { PathResolver } from '../../domain/services/path-resolver.js';
import { CorpusIndexService, type CorpusEntry } from './corpus-index.js';

export type QueryClass = 'DEFINITIONAL' | 'HISTORICAL' | 'STRUCTURAL' | 'PATTERN' | 'GENERAL';

export interface CorpusMatch {
  path: string;
  score: number;
  excerpt: string;
  reasons: string[];
}

// Deterministic by design — this module must never call LLM providers.
// causeGroups, recurringSignals, and answer are THINK-layer signals; they
// were removed from AskResult in TASK-942 to keep the layer boundary clean.
export interface AskResult {
  queryClass: QueryClass;
  keywords: string[];
  matches: CorpusMatch[];
  taskRefs: string[];
  adrRefs: string[];
  principleRefs: string[];
  recurringSignals?: TemporalSpike[];
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

// Scoped to moat artifacts only. Active tasks and guidelines are covered by
// the constraint preflight (TASK-938); scanning them here duplicates work.
const CORPUS_DIRS = [
  PathResolver.from({}).archive,
  PathResolver.from({}).adr,
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
    private temporalIndex?: TemporalIndex,
  ) {}

  async execute(question: string, options?: { projectFilter?: string }): Promise<AskResult> {
    const keywords = this.tokenize(question);
    if (keywords.length === 0) {
      throw new Error('No searchable keywords in question. Add specific terms to query.');
    }

    // Project filter: query corpus index entries from a specific source slug
    if (options?.projectFilter) {
      return this.executeProjectFiltered(question, keywords, options.projectFilter);
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

    let recurringSignals: TemporalSpike[] | undefined;
    if (this.temporalIndex) {
      const spikes = await this.temporalIndex.detectSpikes();
      if (spikes.length > 0) recurringSignals = spikes;
    }

    return {
      queryClass,
      keywords,
      matches: top.map(({ path, score, excerpt, reasons }) => ({ path, score, excerpt, reasons })),
      taskRefs: [...taskRefs].sort(),
      adrRefs: [...adrRefs].sort(),
      principleRefs: [...principleRefs].sort(),
      ...(recurringSignals !== undefined ? { recurringSignals } : {}),
    };
  }

  private async executeProjectFiltered(question: string, keywords: string[], slug: string): Promise<AskResult> {
    const queryClass = this.classifyQuery(question);
    const indexService = new CorpusIndexService(this.fileSystem);
    let index: Awaited<ReturnType<CorpusIndexService['load']>>;
    try {
      index = await indexService.load();
    } catch {
      return { queryClass, keywords, matches: [], taskRefs: [], adrRefs: [], principleRefs: [] };
    }

    const entries = Object.values(index.entries).filter((e: CorpusEntry) => e.source === slug);
    const scored: Array<{ path: string; score: number; excerpt: string; reasons: string[] }> = [];

    for (const entry of entries) {
      const text = [entry.id, entry.decision, entry.constraint, entry.cost, entry.forwardAction, entry.category, entry.severity].join(' ');
      const lower = text.toLowerCase();
      const kwHits = new Map<string, number>();
      for (const kw of keywords) {
        let count = 0, pos = 0;
        while ((pos = lower.indexOf(kw, pos)) !== -1) { count++; pos++; }
        if (count > 0) kwHits.set(kw, count);
      }
      if (kwHits.size === 0) continue;

      const totalHits = [...kwHits.values()].reduce((a, b) => a + b, 0);
      const reasons = [[...kwHits.entries()].sort((a, b) => b[1] - a[1]).map(([kw, n]) => `${kw} ×${n}`).join(', ')];
      const excerpt = (entry.decision || entry.constraint || '').slice(0, 120);
      scored.push({ path: `corpus:${slug}/${entry.id}`, score: totalHits, excerpt, reasons });
    }

    scored.sort((a, b) => b.score - a.score);
    const taskRefs = entries.slice(0, 5).map(e => e.id).sort();

    return {
      queryClass,
      keywords,
      matches: scored.slice(0, 10),
      taskRefs,
      adrRefs: [],
      principleRefs: [],
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
