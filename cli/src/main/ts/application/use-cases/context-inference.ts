import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { ContextIndex } from '../../domain/models/context-index.js';
import type { FeedbackSignal } from '../../domain/models/feedback-signal.js';

const DIRECT_TASK_REFERENCE_BOOST = 4.0;
const DIRECT_ADR_REFERENCE_BOOST = 4.0;
const ADR_AFFECTED_MODULE_BOOST = 3.0;
const ADR_LINKED_TASK_FILE_BOOST = 2.5;
const LOW_SIGNAL_PATTERNS: RegExp[] = [
  /\.test\.ts$/,
  /\.spec\.ts$/,
  /README\.md$/i,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /\.eslintrc/,
  /\.prettierrc/,
  /tsconfig.*\.json$/,
  /CHANGELOG\.md$/i,
];

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
  failurePatterns: Array<{ id: string; title: string; sourceRef: string; score: number }>;
  unresolvedTaskRefs: string[];
  filteredFiles: string[];
  unresolvedAdrRefs: string[];
  filteredAdrFiles: string[];
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
    const taskRefs = this.extractTaskRefs(taskText);
    const adrRefs = this.extractAdrRefs(taskText);
    if (keywords.length === 0 && taskRefs.length === 0 && adrRefs.length === 0) return;

    const feedbackMap = await this.loadFeedbackMap();
    const result = this.score(index, keywords, taskClass, taskText, feedbackMap);
    if (result.confidence < 0.1) return; // suppress low-confidence injections (Metrics Narrowing)
    const section = this.formatSection(result);

    const taskPath = `docs/tasks/${taskId}.md`;
    try {
      const content = await this.fileSystem.readFile(taskPath);
      const needsFeedback = !content.includes('### Context Feedback');
      const sectionWithFeedback = needsFeedback
        ? section + this.feedbackSection()
        : section;
      const updated = this.insertSection(content, sectionWithFeedback);
      await this.fileSystem.writeFile(taskPath, updated);
    } catch { /* task file unavailable — skip write-back */ }
  }

  private async loadFeedbackMap(): Promise<Map<string, FeedbackSignal>> {
    try {
      const raw = await this.fileSystem.readFile('.arch/context-feedback.json');
      const signals = JSON.parse(raw) as FeedbackSignal[];
      const map = new Map<string, FeedbackSignal>();
      for (const s of signals) {
        map.set(s.taskId, s);
      }
      return map;
    } catch {
      return new Map();
    }
  }

  extractKeywords(text: string): string[] {
    return [...new Set(
      text
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .flatMap(w => this.splitCamelCase(w))
        .filter(w => w.length > 2 && !this.stopwords.has(w))
    )];
  }

  score(index: ContextIndex, keywords: string[], taskClass: string, taskText = '', feedbackMap?: Map<string, FeedbackSignal>): ContextResult {
    const kw = new Set(keywords);
    const critMult: Record<string, number> = { core: 1.5, domain: 1.2, support: 1.0, utility: 0.7 };
    const fileScoreMap = new Map<string, number>();
    const adrScoreMap = new Map<string, number>();
    const guidelineScoreMap = new Map<string, number>();
    const failureScoreMap = new Map<string, number>();
    const unresolvedTaskRefs = new Set<string>();
    const filteredFiles = new Set<string>();
    const unresolvedAdrRefs = new Set<string>();
    const filteredAdrFiles = new Set<string>();

    // Keyword pass: base symbol/tag scoring into the shared score map.
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
      score *= (critMult[entry.criticality] ?? 1.0);
      fileScoreMap.set(filePath, (fileScoreMap.get(filePath) ?? 0) + score);
    }

    // Keep existing keyword-driven import expansion, but write contributions into the same score map.
    const topKeywordPaths = [...fileScoreMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path]) => path);
    const expandedPaths = new Set(topKeywordPaths);
    for (const topPath of topKeywordPaths) {
      const entry = index.files[topPath];
      if (!entry) continue;
      for (const imp of entry.imports) {
        if (expandedPaths.has(imp) || !index.files[imp]) continue;
        const impEntry = index.files[imp];
        const impScore = 3.0 * (critMult[impEntry.criticality] ?? 1.0);
        fileScoreMap.set(imp, (fileScoreMap.get(imp) ?? 0) + impScore);
        expandedPaths.add(imp);
      }
    }

    // Task-reference pass: explicit TASK-IDs contribute directly to the shared score map.
    const taskRefs = this.extractTaskRefs(taskText);
    for (const taskRef of taskRefs) {
      const taskEntry = index.tasks?.[taskRef];
      if (!taskEntry) {
        unresolvedTaskRefs.add(taskRef);
        continue;
      }
      for (const filePath of Object.keys(taskEntry.touchedFrequency)) {
        if (this.matchesAnyPattern(filePath, LOW_SIGNAL_PATTERNS)) {
          filteredFiles.add(filePath);
          continue;
        }
        const feedback = feedbackMap?.get(taskRef);
        const boost = feedback?.verdict === 'off'
          ? DIRECT_TASK_REFERENCE_BOOST * 0.1
          : DIRECT_TASK_REFERENCE_BOOST;
        fileScoreMap.set(filePath, (fileScoreMap.get(filePath) ?? 0) + boost);
      }
    }

    // ADR-reference pass: explicit ADR-IDs boost ADR ranking, direct ADR modules, and linked-task provenance.
    for (const adrRef of this.extractAdrRefs(taskText)) {
      const adrEntry = index.adrs?.[adrRef];
      if (!adrEntry) {
        unresolvedAdrRefs.add(adrRef);
        continue;
      }

      const adrStrengthMultiplier = adrEntry.strength === 'enforced' ? 1.5 : 1.0;
      adrScoreMap.set(adrRef, (adrScoreMap.get(adrRef) ?? 0) + DIRECT_ADR_REFERENCE_BOOST * adrStrengthMultiplier);

      for (const filePath of adrEntry.affectedModules) {
        fileScoreMap.set(filePath, (fileScoreMap.get(filePath) ?? 0) + ADR_AFFECTED_MODULE_BOOST);
      }

      const linkedTasks = index.adrTaskLinks?.[adrRef]?.tasks ?? {};
      for (const taskId of Object.keys(linkedTasks)) {
        const taskEntry = index.tasks?.[taskId];
        if (!taskEntry) continue;
        for (const filePath of Object.keys(taskEntry.touchedFrequency)) {
          if (this.matchesAnyPattern(filePath, LOW_SIGNAL_PATTERNS)) {
            filteredAdrFiles.add(filePath);
            continue;
          }
          fileScoreMap.set(filePath, (fileScoreMap.get(filePath) ?? 0) + ADR_LINKED_TASK_FILE_BOOST);
        }
      }
    }

    // Failure Pattern pass
    for (const [failureId, failure] of Object.entries(index.failures ?? {})) {
      const matches = failure.keywords.filter(k => kw.has(k)).length;
      if (matches > 0) {
        const score = matches * (failure.severityHint === 'high' ? 1.5 : 1.0);
        failureScoreMap.set(failureId, (failureScoreMap.get(failureId) ?? 0) + score);
      }
    }

    // If task references past tasks, pull linked failures from that task's keywords
    for (const taskRef of taskRefs) {
      const taskEntry = index.tasks?.[taskRef];
      if (!taskEntry) continue;
      for (const [failureId, failure] of Object.entries(index.failures ?? {})) {
        if (failure.relatedTaskIds.includes(taskRef)) {
          failureScoreMap.set(failureId, (failureScoreMap.get(failureId) ?? 0) + 2.0);
        }
      }
    }

    // Boost guidelines and files from failure scores
    for (const [failureId, fScore] of failureScoreMap.entries()) {
      for (const [gPath, link] of Object.entries(index.guidelineFailureLinks ?? {})) {
        if (link.failureIds.includes(failureId)) {
          guidelineScoreMap.set(gPath, (guidelineScoreMap.get(gPath) ?? 0) + fScore * 2.0);
        }
      }
      const failure = index.failures[failureId];
      if (failure) {
        for (const taskId of failure.relatedTaskIds) {
          const taskEntry = index.tasks?.[taskId];
          if (taskEntry) {
            for (const filePath of Object.keys(taskEntry.touchedFrequency)) {
              if (this.matchesAnyPattern(filePath, LOW_SIGNAL_PATTERNS)) continue;
              fileScoreMap.set(filePath, (fileScoreMap.get(filePath) ?? 0) + fScore * 0.5);
            }
          }
        }
      }
    }

    const allFiles = [...fileScoreMap.entries()]
      .map(([path, score]) => this.toScoredFile(index, path, score))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Score ADRs
    for (const [adrId, adr] of Object.entries(index.adrs)) {
      const matches = adr.keywords.filter(k => kw.has(k)).length;
      if (matches === 0) continue;
      const keywordScore = matches * (adr.strength === 'enforced' ? 1.5 : 1.0);
      adrScoreMap.set(adrId, (adrScoreMap.get(adrId) ?? 0) + keywordScore);
    }

    const adrScores: ScoredAdr[] = [];
    for (const [adrId, adr] of Object.entries(index.adrs)) {
      const score = adrScoreMap.get(adrId) ?? 0;
      if (score <= 0) continue;
      adrScores.push({ id: adrId, title: adr.title, strength: adr.strength, score });
    }
    adrScores.sort((a, b) => {
      if (a.strength !== b.strength) return a.strength === 'enforced' ? -1 : 1;
      return b.score - a.score;
    });
    const topAdrs = adrScores.slice(0, 3);

    // Score guidelines by task class + tag match + failure boost
    const guidelineScores: ScoredGuideline[] = [];
    for (const [name, g] of Object.entries(index.guidelines)) {
      let score = g.taskClasses.includes(taskClass) ? 2.0 : 0;
      score += g.tags.filter(t => kw.has(t)).length * 0.5;
      score += guidelineScoreMap.get(name) ?? 0;
      if (score <= 0) continue;
      guidelineScores.push({ name, score });
    }
    guidelineScores.sort((a, b) => b.score - a.score);
    const topGuidelines = guidelineScores.slice(0, 2);

    // Top Failure Patterns
    const topFailurePatterns = [...failureScoreMap.entries()]
      .map(([id, score]) => ({
        id,
        score,
        title: index.failures[id].title,
        sourceRef: index.failures[id].sourceRef,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

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
      this.getImports(index, path).forEach(imp => { if (filePaths.has(imp)) mutualEdges++; });
    }
    const maxEdges = allFiles.length * (allFiles.length - 1);
    const graphCoherence = maxEdges > 0 ? Math.min(mutualEdges / maxEdges, 1) : 0;
    const confidence = Math.min(overlapDensity * 0.4 + enforcedFraction * 0.35 + graphCoherence * 0.25, 1);

    return {
      confidence,
      files: allFiles,
      adrs: topAdrs,
      guidelines: topGuidelines,
      failurePatterns: topFailurePatterns,
      unresolvedTaskRefs: [...unresolvedTaskRefs],
      filteredFiles: [...filteredFiles],
      unresolvedAdrRefs: [...unresolvedAdrRefs],
      filteredAdrFiles: [...filteredAdrFiles],
    };
  }

  formatSection(result: ContextResult): string {
    const conf = result.confidence.toFixed(2);
    const lines: string[] = [`### Relevant Context`, `_confidence: ${conf}_`, ''];

    if (result.files.length > 0) {
      lines.push('**Files:**');
      for (const f of result.files) {
        lines.push(`- ${f.path} _(${f.criticality})_`);
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

    if (result.failurePatterns.length > 0) {
      lines.push('**Failure Patterns:**');
      for (const p of result.failurePatterns) {
        lines.push(`- ${p.title} _(${p.sourceRef})_`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  insertSection(content: string, section: string): string {
    // Remove existing Relevant Context section — stops at ### Context Feedback if present
    const cleaned = content.replace(/\n### Relevant Context\n[\s\S]*?(?=\n###|\n##|$)/, '');

    // Insert after ### Context section if present
    const contextIdx = cleaned.indexOf('\n### Context\n');
    if (contextIdx !== -1) {
      const nextSection = cleaned.indexOf('\n###', contextIdx + 1);
      if (nextSection !== -1) {
        return cleaned.slice(0, nextSection) + '\n\n' + section + cleaned.slice(nextSection);
      }
    }

    // Insert before ### Context Feedback if already present (preserve human feedback position)
    const feedbackIdx = cleaned.indexOf('\n### Context Feedback');
    if (feedbackIdx !== -1) {
      return cleaned.slice(0, feedbackIdx) + '\n\n' + section + cleaned.slice(feedbackIdx);
    }

    // Otherwise insert before ### Acceptance Criteria
    const acIdx = cleaned.indexOf('\n### Acceptance Criteria');
    if (acIdx !== -1) {
      return cleaned.slice(0, acIdx) + '\n\n' + section + cleaned.slice(acIdx);
    }

    return cleaned.trimEnd() + '\n\n' + section + '\n';
  }

  private feedbackSection(): string {
    return [
      '',
      '### Context Feedback',
      '- [ ] accurate — files and ADRs were on-target',
      '- [ ] partial — correct direction, missing key files',
      '- [ ] off — wrong files dominated',
      '',
    ].join('\n');
  }

  private splitCamelCase(s: string): string[] {
    return s.replace(/([A-Z])/g, ' $1').trim().toLowerCase().split(/\s+/).filter(Boolean);
  }

  private extractTaskRefs(taskText: string): string[] {
    return [...new Set(taskText.match(/TASK-\d+/g) ?? [])];
  }

  private extractAdrRefs(taskText: string): string[] {
    return [...new Set(taskText.match(/ADR-\d+/g) ?? [])];
  }

  private matchesAnyPattern(value: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(value));
  }

  private toScoredFile(index: ContextIndex, path: string, score: number): ScoredFile {
    const entry = index.files[path];
    return {
      path,
      score,
      criticality: entry?.criticality ?? this.inferCriticality(path),
      runtimeUsage: entry?.runtimeUsage ?? 'cold',
    };
  }

  private getImports(index: ContextIndex, path: string): string[] {
    return index.files[path]?.imports ?? [];
  }

  private inferCriticality(filePath: string): string {
    if (filePath.includes('/domain/')) return 'core';
    if (filePath.includes('/application/')) return 'domain';
    if (filePath.includes('/infrastructure/')) return 'support';
    return 'utility';
  }
}
