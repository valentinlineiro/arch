import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import { CorpusIndexService } from './corpus-index.js';
import { ArchiveParser } from '../../domain/services/archive-parser.js';
import { MetricsEngine } from '../../domain/services/metrics-engine.js';
import { PathResolver } from '../../domain/services/path-resolver.js';
import * as path from 'node:path';

interface TensionEntry {
  category: string;
  count: number;
  severities: string[];
  taskIds: string[];
  isWeakSignal: boolean;
  isStrongSignal: boolean;
}

const WEAK_THRESHOLD = 3;
const STRONG_THRESHOLD = 5;

export class HanseiSynthesizer {
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository,
    private rootPath: string = '.',
  ) {}

  async run(): Promise<{ halted: boolean; haltCategories: string[] }> {
    console.log('\n  ⚡ Hansei Pattern Synthesis — deterministic corpus scan\n');

    // 1. Collect Hansei data directly from archive
    const tensions = await this.computeTensions();

    if (tensions.length === 0) {
      console.log('  No H2+ patterns found. Corpus is clean or below threshold.\n');
      return { halted: false, haltCategories: [] };
    }

    // 2. Report findings
    for (const t of tensions) {
      const signal = t.isStrongSignal ? '🔴 STRONG' : '⚠ WEAK';
      console.log(`  ${signal} signal: ${t.category}  ${t.count}x  [${t.severities.join(', ')}]`);
      console.log(`    Tasks: ${t.taskIds.slice(0, 5).join(', ')}${t.taskIds.length > 5 ? ` +${t.taskIds.length - 5} more` : ''}`);
    }
    console.log('');

    // 3. Create or update TENSION files
    let created = 0;
    let updated = 0;
    for (const t of tensions) {
      const result = await this.upsertTension(t);
      if (result === 'created') created++;
      else if (result === 'updated') updated++;
    }

    // 4. INBOX alert for strong signals (with alert fatigue throttle)
    const strong = tensions.filter(t => t.isStrongSignal);
    let halted = false;
    let haltCategories: string[] = [];
    if (strong.length > 0) {
      const result = await this.appendInboxAlert(strong);
      halted = result.halted;
      haltCategories = result.haltCategories;
    }

    console.log(`  TENSION files: ${created} created, ${updated} updated`);
    if (strong.length > 0) {
      const alertCount = strong.filter(t => !haltCategories.includes(t.category)).length;
      console.log(`  INBOX: ${alertCount} PATTERN-ALERT entries appended` + (halted ? `, ${haltCategories.length} halted (ANDON_HALT)` : ''));
    }
    console.log('');

    return { halted, haltCategories };
  }

  private async computeTensions(): Promise<TensionEntry[]> {
    const indexService = new CorpusIndexService(this.fileSystem, this.gitRepository);
    const index = await indexService.load();
    const entries = Object.values(index.entries);

    const map = new Map<string, { severities: string[]; taskIds: string[] }>();

    for (const entry of entries) {
      if (!['H2', 'H3a', 'H3b'].includes(entry.severity)) continue;
      const cat = entry.category;
      if (!cat || cat === '[no-issue]') continue;
      if (!map.has(cat)) map.set(cat, { severities: [], taskIds: [] });
      const e = map.get(cat)!;
      e.taskIds.push(entry.id);
      if (!e.severities.includes(entry.severity)) e.severities.push(entry.severity);
    }

    return Array.from(map.entries())
      .filter(([, v]) => v.taskIds.length >= WEAK_THRESHOLD)
      .map(([category, v]) => ({
        category,
        count: v.taskIds.length,
        severities: v.severities.sort(),
        taskIds: v.taskIds,
        isWeakSignal: v.taskIds.length >= WEAK_THRESHOLD,
        isStrongSignal: v.taskIds.length >= STRONG_THRESHOLD,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private async upsertTension(t: TensionEntry): Promise<'created' | 'updated' | 'skipped'> {
    const tensionsDir = `${this.rootPath}/docs/tensions`;

    // Find existing TENSION for this category
    let files: string[] = [];
    try { files = await this.fileSystem.readDirectory(tensionsDir); } catch {}

    const existing = files.find(f => {
      return f.endsWith('.md') && !f.includes('template') && !f.includes('TEMPLATE');
    });

    // Check if any existing TENSION covers this category
    let existingFile: string | null = null;
    for (const f of files.filter(f => f.endsWith('.md') && !f.toLowerCase().includes('template'))) {
      try {
        const content = await this.fileSystem.readFile(`${tensionsDir}/${f}`);
        if (content.includes(t.category)) {
          existingFile = f;
          break;
        }
      } catch { /* skip */ }
    }

    const today = new Date().toISOString().slice(0, 10);

    if (existingFile) {
      // Update: append new evidence block
      try {
        const content = await this.fileSystem.readFile(`${tensionsDir}/${existingFile}`);
        if (content.includes(`Evidence block — ${today}`)) return 'skipped';

        const evidence = `\n## Evidence block — ${today}\n**Count:** ${t.count} occurrences\n**Task IDs:** ${t.taskIds.join(', ')}\n**Severities:** ${t.severities.join(', ')}\n`;
        await this.fileSystem.writeFile(`${tensionsDir}/${existingFile}`, content.rstrip() + evidence);
        return 'updated';
      } catch { return 'skipped'; }
    }

    // Create new TENSION file
    const nextNum = await this.nextTensionNumber(tensionsDir, files);
    const slug = t.category.replace(/[\[\]]/g, '').toLowerCase();
    const filename = `TENSION-${String(nextNum).padStart(3, '0')}-${slug}.md`;

    const content = [
      `# TENSION-${String(nextNum).padStart(3, '0')}: Recurring ${t.category} pattern`,
      `<!-- Created by HanseiSynthesizer — deterministic corpus scan -->`,
      `<!-- Status: OPEN | RESOLVED -->`,
      ``,
      `**Status:** OPEN`,
      `**Category:** ${t.category}`,
      `**Detected:** ${today}`,
      `**Detected-by:** HanseiSynthesizer (deterministic)`,
      `**Signal strength:** ${t.isStrongSignal ? 'STRONG' : 'WEAK'} (${t.count} occurrences, threshold ${t.isStrongSignal ? STRONG_THRESHOLD : WEAK_THRESHOLD})`,
      ``,
      `## Pattern`,
      `${t.category} has appeared ${t.count} times at H2+ severity across the archive.`,
      `Severities observed: ${t.severities.join(', ')}.`,
      ``,
      `## Affected Tasks`,
      t.taskIds.map(id => `- ${id}`).join('\n'),
      ``,
      `## Proposed Protocol Change`,
      `(Human review required — fill in root cause and proposed fix)`,
      ``,
      `## Evidence`,
      `**First detected:** ${today}`,
      `**Task IDs:** ${t.taskIds.join(', ')}`,
      `**Severities:** ${t.severities.join(', ')}`,
      ``,
      `## Resolution`,
      `<!-- When resolved, set Status: RESOLVED and describe the fix -->`,
    ].join('\n');

    await this.fileSystem.writeFile(`${tensionsDir}/${filename}`, content);
    return 'created';
  }

  private async nextTensionNumber(dir: string, files: string[]): Promise<number> {
    const nums = files
      .map(f => f.match(/TENSION-(\d+)/)?.[1])
      .filter(Boolean)
      .map(n => parseInt(n!, 10));
    return nums.length > 0 ? Math.max(...nums) + 1 : 1;
  }

  private async appendInboxAlert(tensions: TensionEntry[]): Promise<{ halted: boolean; haltCategories: string[] }> {
    const inboxPath = `${this.rootPath}/${PathResolver.from({}).inbox}`;
    const today = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const emitLines: string[] = [];
    const escalateLines: string[] = [];
    const haltCategories: string[] = [];

    // EscalationStore.append() handles deduplication — emit all tensions directly
    for (const t of tensions) {
      emitLines.push(`[PATTERN-ALERT] ${t.category} detected ${t.count} times — systemic issue. See docs/tensions/`);
    }

    const halted = haltCategories.length > 0;

    try {
      const content = await this.fileSystem.readFile(inboxPath);
      let body = content.rstrip();

      if (emitLines.length > 0 || escalateLines.length > 0) {
        const alerts = [...emitLines, ...escalateLines].join('\n');
        body += `\n\n## ${today} — Pattern Alerts\n${alerts}\n`;
      }

      if (halted) {
        for (const cat of haltCategories) {
          body += `\n[ANDON_HALT] Alert fatigue threshold reached (5th consecutive) for "${cat}" — system halted.\n`;
        }
      }

      await this.fileSystem.writeFile(inboxPath, body);
    } catch { /* non-blocking */ }

    return { halted, haltCategories };
  }
}

// String.prototype.rstrip polyfill (trimEnd)
declare global {
  interface String { rstrip(): string; }
}
String.prototype.rstrip = function() { return this.trimEnd(); };
