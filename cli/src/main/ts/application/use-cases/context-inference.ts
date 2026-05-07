import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { ContextIndex } from '../../domain/models/context-index.js';

export interface ScoredFile {
  path: string;
  score: number;
  criticality: string;
  runtimeUsage: string;
}

export interface ScoredAdr {
  id: string;
  title: string;
  strength: string;
  score: number;
}

export interface ScoredGuideline {
  name: string;
  score: number;
}

export interface ContextResult {
  confidence: number;
  files: ScoredFile[];
  adrs: ScoredAdr[];
  guidelines: ScoredGuideline[];
}

export class ContextInference {
  private readonly indexPath = '.arch/context-index.json';
  private readonly stopwords = new Set([
    'the', 'a', 'an', 'is', 'are', 'in', 'of', 'to', 'and', 'for', 'that',
    'this', 'it', 'not', 'as', 'at', 'by', 'or', 'be', 'do', 'if', 'on',
    'we', 'so', 'can', 'its', 'all', 'with', 'but', 'use', 'new', 'from',
    'has', 'have', 'was', 'were', 'will', 'one', 'two', 'each', 'any', 'add',
  ]);

  constructor(private fileSystem: FileSystem) {}

  async execute(taskId: string, taskText: string, taskClass: string): Promise<void> {
    let index: ContextIndex;
    try {
      const raw = await this.fileSystem.readFile(this.indexPath);
      index = JSON.parse(raw) as ContextIndex;
    } catch {
      return; // Index absent — graceful skip
    }

    const keywords = this.extractKeywords(taskText);
    if (keywords.length === 0) return;

    const result = this.score(index, keywords, taskClass);
    const section = this.formatSection(result);

    const taskPath = `docs/tasks/${taskId}.md`;
    const content = await this.fileSystem.readFile(taskPath);
    const updated = this.insertSection(content, section);
    await this.fileSystem.writeFile(taskPath, updated);
  }

  extractKeywords(text: string): string[] {
    return [...new Set(
      text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !this.stopwords.has(w))
        .flatMap(w => this.splitCamelCase(w))
        .filter(w => w.length > 2 && !this.stopwords.has(w))
    )];
  }

  score(index: ContextIndex, keywords: string[], taskClass: string): ContextResult {
    const kw = new Set(keywords);
    const critMult: Record<string, number> = { core: 1.5, domain: 1.2, support: 1.0, utility: 0.7 };
    const usageMult: Record<string, number> = { hot: 1.3, warm: 1.0, cold: 0.7 };

    // Score files by symbol and tag match
    const fileScores: ScoredFile[] = [];
    for (const [filePath, entry] of Object.entries(index.files)) {
      let score = 0;
      for (const symbol of entry.symbols) {
        if (kw.has(symbol.toLowerCase())) score += 2.0;
        for (const part of this.splitCamelCase(symbol)) {
          if (kw.has(part) && part.length > 2) score += 1.5;
        }
      }
      for (const tag of entry.tags) {
        if (kw.has(tag)) score += 0.5;
      }
      if (score <= 0) continue;
      score *= (critMult[entry.criticality] ?? 1.0) * (usageMult[entry.runtimeUsage] ?? 1.0);
      fileScores.push({ path: filePath, score, criticality: entry.criticality, runtimeUsage: entry.runtimeUsage });
    }
    fileScores.sort((a, b) => b.score - a.score);
    const top5 = fileScores.slice(0, 5);

    // Expand with direct import neighbors of top-5 (direct_import weight = 3.0)
    const topPaths = new Set(top5.map(f => f.path));
    const neighborCandidates: ScoredFile[] = [];
    for (const { path: topPath } of top5) {
      const entry = index.files[topPath];
      if (!entry) continue;
      for (const imp of entry.imports) {
        if (topPaths.has(imp) || !index.files[imp]) continue;
        const impEntry = index.files[imp];
        const impScore = 3.0 * (critMult[impEntry.criticality] ?? 1.0) * (usageMult[impEntry.runtimeUsage] ?? 1.0);
        neighborCandidates.push({ path: imp, score: impScore, criticality: impEntry.criticality, runtimeUsage: impEntry.runtimeUsage });
        topPaths.add(imp);
      }
    }
    const allFiles = [...top5, ...neighborCandidates]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Score ADRs
    const adrScores: ScoredAdr[] = [];
    for (const [adrId, adr] of Object.entries(index.adrs)) {
      const matches = adr.keywords.filter(k => kw.has(k)).length;
      if (matches === 0) continue;
      const score = matches * (adr.strength === 'enforced' ? 1.5 : 1.0);
      adrScores.push({ id: adrId, title: adr.title, strength: adr.strength, score });
    }
    adrScores.sort((a, b) => {
      if (a.strength !== b.strength) return a.strength === 'enforced' ? -1 : 1;
      return b.score - a.score;
    });
    const topAdrs = adrScores.slice(0, 3);

    // Score guidelines by task class + tag match
    const guidelineScores: ScoredGuideline[] = [];
    for (const [name, g] of Object.entries(index.guidelines)) {
      let score = g.taskClasses.includes(taskClass) ? 2.0 : 0;
      score += g.tags.filter(t => kw.has(t)).length * 0.5;
      if (score <= 0) continue;
      guidelineScores.push({ name, score });
    }
    guidelineScores.sort((a, b) => b.score - a.score);
    const topGuidelines = guidelineScores.slice(0, 2);

    // Compute confidence
    const kwArray = [...kw];
    const matchedKw = kwArray.filter(k =>
      Object.values(index.files).some(f => f.tags.includes(k) || f.symbols.some(s => s.toLowerCase() === k))
    );
    const overlapDensity = kwArray.length > 0 ? matchedKw.length / kwArray.length : 0;
    const enforcedFraction = topAdrs.length > 0
      ? topAdrs.filter(a => a.strength === 'enforced').length / topAdrs.length
      : 0;
    const filePaths = new Set(allFiles.map(f => f.path));
    let mutualEdges = 0;
    for (const { path } of allFiles) {
      const entry = index.files[path];
      if (entry) entry.imports.forEach(imp => { if (filePaths.has(imp)) mutualEdges++; });
    }
    const maxEdges = allFiles.length * (allFiles.length - 1);
    const graphCoherence = maxEdges > 0 ? Math.min(mutualEdges / maxEdges, 1) : 0;
    const confidence = Math.min(overlapDensity * 0.4 + enforcedFraction * 0.35 + graphCoherence * 0.25, 1);

    return { confidence, files: allFiles, adrs: topAdrs, guidelines: topGuidelines };
  }

  formatSection(result: ContextResult): string {
    const conf = result.confidence.toFixed(2);
    const lines: string[] = [`### Relevant Context`, `_confidence: ${conf}_`, ''];

    if (result.files.length > 0) {
      lines.push('**Files:**');
      for (const f of result.files) {
        lines.push(`- ${f.path} _(${f.criticality}, ${f.runtimeUsage})_`);
      }
      lines.push('');
    }

    if (result.adrs.length > 0) {
      lines.push('**ADRs:**');
      for (const a of result.adrs) {
        lines.push(`- ${a.id}: ${a.title} _(${a.strength})_`);
      }
      lines.push('');
    }

    if (result.guidelines.length > 0) {
      lines.push('**Guidelines:**');
      for (const g of result.guidelines) {
        lines.push(`- ${g.name}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  insertSection(content: string, section: string): string {
    // Remove existing Relevant Context section if present
    const cleaned = content.replace(/\n### Relevant Context\n[\s\S]*?(?=\n###|\n##|$)/, '');

    // Insert after ### Context section if present
    const contextIdx = cleaned.indexOf('\n### Context\n');
    if (contextIdx !== -1) {
      const nextSection = cleaned.indexOf('\n###', contextIdx + 1);
      if (nextSection !== -1) {
        return cleaned.slice(0, nextSection) + '\n\n' + section + cleaned.slice(nextSection);
      }
    }

    // Otherwise insert before ### Acceptance Criteria
    const acIdx = cleaned.indexOf('\n### Acceptance Criteria');
    if (acIdx !== -1) {
      return cleaned.slice(0, acIdx) + '\n\n' + section + cleaned.slice(acIdx);
    }

    return cleaned.trimEnd() + '\n\n' + section + '\n';
  }

  private splitCamelCase(s: string): string[] {
    return s.replace(/([A-Z])/g, ' $1').trim().toLowerCase().split(/\s+/).filter(Boolean);
  }
}
