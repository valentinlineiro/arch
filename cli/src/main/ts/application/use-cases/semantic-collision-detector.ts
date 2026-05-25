import type { FileSystem } from '../../domain/repositories/file-system.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

interface CollisionHit {
  adrId: string;
  adrTitle: string;
  matchedTerms: string[];
  negationSnippet: string;
}

const NEGATION_PATTERNS = [
  'must not',
  'must never',
  'never ',
  'prohibited',
  'forbidden',
  'shall not',
  'cannot ',
  'is not permitted',
  'may not',
  'only via',
  'strictly prohibited',
  'never allowed',
  'not allowed',
];

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'it', 'its', 'if', 'as',
  'that', 'this', 'these', 'those', 'from', 'by', 'all', 'any', 'each',
  'when', 'where', 'which', 'who', 'how', 'what', 'not', 'no', 'so',
  'task', 'tasks', 'arch', 'file', 'files', 'code', 'test', 'run',
  'pass', 'exit', 'cmd', 'grep', 'output', 'input', 'value', 'field',
]);

function extractTerms(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w));
}

function findNegationSnippet(text: string): string | null {
  const lower = text.toLowerCase();
  for (const pattern of NEGATION_PATTERNS) {
    const idx = lower.indexOf(pattern);
    if (idx !== -1) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(text.length, idx + pattern.length + 80);
      return text.slice(start, end).replace(/\s+/g, ' ').trim();
    }
  }
  return null;
}

export class SemanticCollisionDetector {
  constructor(private fileSystem: FileSystem) {}

  async execute(taskContent: string, taskId?: string): Promise<string | null> {
    const acBlock = this.extractAcBlock(taskContent);
    if (!acBlock) return null;

    const acTerms = extractTerms(acBlock);
    if (acTerms.length === 0) return null;

    const dismissedAdrs = this.extractDismissedAdrs(taskContent);

    let files: string[];
    try {
      files = await this.fileSystem.readDirectory(PathResolver.from({}).adr);
    } catch {
      return null;
    }

    const hits: CollisionHit[] = [];

    for (const file of files) {
      if (!file.endsWith('.md') || file.startsWith('TEMPLATE')) continue;
      const adrIdMatch = file.match(/^(ADR-\d+)/);
      if (!adrIdMatch) continue;
      const adrId = adrIdMatch[1];
      if (dismissedAdrs.has(adrId)) continue;

      try {
        const content = await this.fileSystem.readFile(`${PathResolver.from({}).adr}/${file}`);
        if (!content.includes('**Status:** ACCEPTED')) continue;

        const snippet = findNegationSnippet(content);
        if (!snippet) continue;

        const adrTerms = extractTerms(content);
        const adrTermSet = new Set(adrTerms);
        const shared = acTerms.filter(t => adrTermSet.has(t));

        if (shared.length < 3) continue;

        const titleMatch = content.match(/^#\s+ADR-\d+[:\-\s]+(.+)$/m);
        hits.push({
          adrId,
          adrTitle: titleMatch?.[1]?.trim() ?? file,
          matchedTerms: shared.slice(0, 5),
          negationSnippet: snippet,
        });
      } catch {
        continue;
      }
    }

    if (hits.length === 0) return null;
    return this.format(hits, taskId);
  }

  private extractAcBlock(content: string): string | null {
    const acMatch = content.match(/###\s+Acceptance Criteria\s*\n([\s\S]*?)(?:\n###|\n##|$)/);
    return acMatch?.[1] ?? null;
  }

  private extractDismissedAdrs(content: string): Set<string> {
    const dismissed = new Set<string>();
    const regex = /<!--\s*adr-conflict-dismissed:\s*(ADR-\d+)\s*-->/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) {
      dismissed.add(m[1]);
    }
    return dismissed;
  }

  private format(hits: CollisionHit[], taskId?: string): string {
    const lines: string[] = ['── ADR Conflict Advisory ────────────────────────────────────────'];
    lines.push('  (advisory only — task proceeds regardless)');
    lines.push('');
    for (const h of hits) {
      lines.push(`  ⚠  ${h.adrId}: ${h.adrTitle}`);
      lines.push(`     Shared terms: ${h.matchedTerms.join(', ')}`);
      lines.push(`     Constraint: "…${h.negationSnippet}…"`);
      if (taskId) {
        lines.push(`     Dismiss: add <!-- adr-conflict-dismissed: ${h.adrId} --> to ${taskId}.md`);
      }
      lines.push('');
    }
    lines.push('─────────────────────────────────────────────────────────────────');
    return lines.join('\n');
  }
}
