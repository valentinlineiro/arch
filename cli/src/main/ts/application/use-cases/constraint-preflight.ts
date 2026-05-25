import type { FileSystem } from '../../domain/repositories/file-system.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

interface AdrHit {
  id: string;
  title: string;
}

interface TensionHit {
  id: string;
  title: string;
}

interface SignalHit {
  taskId: string;
  category: string;
}

export class ConstraintPreflight {
  constructor(
    private fileSystem: FileSystem,
    private nowIso?: string,
  ) {}

  async execute(contextPaths: string[]): Promise<string | null> {
    if (contextPaths.length === 0) return null;

    const tokens = this.pathTokens(contextPaths);
    if (tokens.length === 0) return null;

    const [adrs, tensions, signals] = await Promise.all([
      this.scanAdrs(tokens),
      this.scanTensions(tokens),
      this.scanRecentSignals(tokens),
    ]);

    if (adrs.length === 0 && tensions.length === 0 && signals.length === 0) return null;

    return this.format(adrs, tensions, signals);
  }

  private static GENERIC_SEGMENTS = new Set([
    'cli', 'src', 'main', 'ts', 'js', 'lib', 'dist', 'test',
    'application', 'domain', 'infrastructure', 'use-cases', 'commands',
    'docs', 'adr', 'tasks', 'archive', 'guidelines',
  ]);

  private pathTokens(paths: string[]): string[] {
    const tokens = new Set<string>();
    for (const p of paths) {
      // Add full path as a match candidate
      const trimmed = p.replace(/\/$/, '');
      if (trimmed.length > 3) tokens.add(trimmed);
      // Add leaf segment if meaningful
      const segments = p.split('/').filter(Boolean);
      const leaf = segments[segments.length - 1] ?? '';
      if (leaf.length > 4 && !ConstraintPreflight.GENERIC_SEGMENTS.has(leaf)) {
        tokens.add(leaf);
      }
      // Add penultimate segment if leaf is generic
      if (segments.length >= 2) {
        const parent = segments[segments.length - 2] ?? '';
        if (parent.length > 4 && !ConstraintPreflight.GENERIC_SEGMENTS.has(parent)) {
          tokens.add(parent);
        }
      }
    }
    return Array.from(tokens);
  }

  private overlaps(tokens: string[], content: string): boolean {
    return tokens.some(t => content.includes(t));
  }

  private async scanAdrs(tokens: string[]): Promise<AdrHit[]> {
    const hits: AdrHit[] = [];
    let files: string[];
    const pr = PathResolver.from({});
    try { files = await this.fileSystem.readDirectory(pr.adr); } catch { return []; }

    for (const file of files) {
      if (!file.endsWith('.md') || file.startsWith('ADR-000') || file.startsWith('TEMPLATE')) continue;
      try {
        const content = await this.fileSystem.readFile(`${PathResolver.from({}).adr}/${file}`);
        if (!content.includes('**Status:** ACCEPTED')) continue;
        if (!this.overlaps(tokens, content)) continue;
        const idMatch = content.match(/^#\s+(ADR-\d+)/m);
        const titleMatch = content.match(/^#\s+ADR-\d+[:\s]+(.+)$/m);
        if (idMatch) hits.push({ id: idMatch[1], title: titleMatch?.[1]?.trim() ?? file });
      } catch { continue; }
    }
    return hits;
  }

  private async scanTensions(tokens: string[]): Promise<TensionHit[]> {
    const hits: TensionHit[] = [];
    let files: string[];
    try { files = await this.fileSystem.readDirectory('docs/tensions'); } catch { return []; }

    for (const file of files) {
      if (!file.match(/^TENSION-\d+\.md$/)) continue;
      try {
        const content = await this.fileSystem.readFile(`docs/tensions/${file}`);
        if (/\*\*Status:\*\*\s*closed/i.test(content)) continue;
        if (!this.overlaps(tokens, content)) continue;
        const idMatch = content.match(/^#\s+(TENSION-\d+)/m);
        const titleMatch = content.match(/^#\s+TENSION-\d+[:\s]+(.+)$/m);
        if (idMatch) hits.push({ id: idMatch[1], title: titleMatch?.[1]?.trim() ?? file });
      } catch { continue; }
    }
    return hits;
  }

  private async scanRecentSignals(tokens: string[]): Promise<SignalHit[]> {
    const hits: SignalHit[] = [];
    const cutoff = new Date(this.nowIso ?? new Date().toISOString());
    cutoff.setDate(cutoff.getDate() - 30);

    let files: string[];
    const archivePr = PathResolver.from({});
    try { files = await this.fileSystem.readDirectory(archivePr.archive); } catch { return []; }

    for (const file of files) {
      if (!file.match(/^TASK-\d+\.md$/)) continue;
      try {
        const content = await this.fileSystem.readFile(`${archivePr.archive}/${file}`);
        const closedMatch = content.match(/Closed-at:\s*([^\s|*\n]+)/);
        if (!closedMatch) continue;
        const closedAt = new Date(closedMatch[1]);
        if (isNaN(closedAt.getTime()) || closedAt < cutoff) continue;
        if (!content.includes('## Hansei')) continue;
        if (!this.overlaps(tokens, content)) continue;
        const taskMatch = file.match(/^(TASK-\d+)\.md$/);
        const categoryMatch = content.match(/\*\*Category:\*\*\s*(\[[^\]]+\])/);
        if (taskMatch && categoryMatch) {
          hits.push({ taskId: taskMatch[1], category: categoryMatch[1] });
        }
      } catch { continue; }
    }
    return hits;
  }

  private format(adrs: AdrHit[], tensions: TensionHit[], signals: SignalHit[]): string {
    const lines: string[] = ['── Constraint Preflight ─────────────────────────────────────────'];

    if (adrs.length > 0) {
      lines.push('ADRs (ACCEPTED):');
      for (const { id, title } of adrs) lines.push(`  ${id}: ${title}`);
    }

    if (tensions.length > 0) {
      lines.push('Tensions:');
      for (const { id, title } of tensions) lines.push(`  ${id}: ${title}`);
    }

    if (signals.length > 0) {
      lines.push('Recent Signals (≤30d):');
      const byCategory = new Map<string, string[]>();
      for (const { taskId, category } of signals) {
        const list = byCategory.get(category) ?? [];
        list.push(taskId);
        byCategory.set(category, list);
      }
      for (const [cat, ids] of byCategory) lines.push(`  ${cat}: ${ids.join(', ')}`);
    }

    lines.push('─────────────────────────────────────────────────────────────────');
    return lines.join('\n');
  }
}
