import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Decision } from '../../domain/models/decision.js';
import { randomUUID } from 'node:crypto';
import { PathResolver } from '../../domain/services/path-resolver.js';

export class AdrDecisionParser {
  constructor(private repoPath: string) {}

  parse(): Decision[] {
    const decisions: Decision[] = [];

    for (const dir of [PathResolver.from({}).adr, 'adr', '.adr']) {
      const full = join(this.repoPath, dir);
      if (!existsSync(full)) continue;

      const files = readdirSync(full).filter(f => f.endsWith('.md') && !f.includes('template'));
      for (const file of files) {
        try {
          const content = readFileSync(join(full, file), 'utf8');
          const decision = this.parseAdr(file, content);
          if (decision) decisions.push(decision);
        } catch { /* skip unreadable */ }
      }
      break;
    }

    return decisions;
  }

  private parseAdr(filename: string, content: string): Decision | null {
    const titleMatch = content.match(/^#\s+(.+)/m);
    const statusMatch = content.match(/##\s+Status\s*\n+(.+)/im);
    if (!titleMatch) return null;

    const title = titleMatch[1].trim();
    const status = statusMatch?.[1]?.trim().toLowerCase() ?? 'unknown';

    // Skip superseded/deprecated ADRs
    if (status.includes('superseded') || status.includes('deprecated')) return null;

    // Extract subject from title (e.g., "ADR-012: Use ESM modules" → subject = "esm-modules")
    const subject = title
      .replace(/^ADR-?\d+[:\s]+/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40);

    // Extract decision body
    const decisionSection = content.match(/##\s+Decision\s*\n+([\s\S]*?)(?=\n##|$)/im)?.[1]?.trim() ?? '';
    const contextSection = content.match(/##\s+Context\s*\n+([\s\S]*?)(?=\n##|$)/im)?.[1]?.trim() ?? '';

    // Infer impact from keywords
    const text = (title + decisionSection).toLowerCase();
    const impact = text.includes('critical') || text.includes('breaking') || text.includes('major') ? 'HIGH'
      : text.includes('should') || text.includes('prefer') ? 'LOW'
      : 'MEDIUM';

    // Infer type
    const type = title.toLowerCase().includes('owner') || title.toLowerCase().includes('team') ? 'OWNERSHIP'
      : title.toLowerCase().includes('process') || title.toLowerCase().includes('review') || title.toLowerCase().includes('protocol') ? 'PROCESS'
      : 'ARCHITECTURAL';

    // Try to extract date from filename (ADR-001-...) or content
    const dateMatch = content.match(/\d{4}-\d{2}-\d{2}/) ?? filename.match(/\d{4}-\d{2}-\d{2}/);
    const definedAt = dateMatch ? new Date(dateMatch[0]) : new Date(0);

    return {
      id: `adr:${filename.replace('.md', '')}`,
      type,
      subject,
      title,
      description: contextSection.slice(0, 300) || decisionSection.slice(0, 300),
      intendedState: decisionSection.slice(0, 500),
      status: 'INSUFFICIENT_EVIDENCE', // will be updated by reconciliation engine
      impact,
      evidenceIds: [],
      metadata: {
        source: 'adr',
        definedAt,
        author: content.match(/\*\*Author:\*\*\s*([^\n]+)/)?.[1]?.trim(),
      },
    };
  }
}
