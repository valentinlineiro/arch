import type { FileSystem } from '../repositories/file-system.js';
import type { Task } from '../models/task.js';

export interface HanseiAuditResult {
  taskId: string;
  verdict: 'PASS' | 'CONCEALMENT' | 'INFLATION' | 'WARN';
  severity?: string;
  category?: string;
  details: string[];
}

// Patterns that represent debt which MUST be declared in Hansei if present in changed files
const CONCEALMENT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /:\s*any\b/g,                                  label: 'TypeScript `any` cast' },
  { pattern: /as\s+any\b/g,                                 label: 'TypeScript `as any` cast' },
  { pattern: /@ts-ignore/g,                                  label: '@ts-ignore suppression' },
  { pattern: /@ts-nocheck/g,                                 label: '@ts-nocheck suppression' },
  { pattern: /\/\/\s*(hack|HACK|fixme|FIXME|kludge|KLUDGE)/g, label: 'hack/fixme comment' },
  { pattern: /TODO:\s*(?!.*TASK-\d)/g,                      label: 'TODO without task reference' },
  { pattern: /console\.(log|warn|error)\(/g,                label: 'console.log left in non-CLI code' },
  { pattern: /eslint-disable/g,                             label: 'eslint-disable suppression' },
  { pattern: /istanbul ignore/g,                            label: 'coverage suppression' },
];

// Keywords that suggest H2+ Hansei but are suspicious for minor local fixes
const INFLATION_TRIGGERS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /systemic\s+risk/i,                            label: 'systemic risk claim' },
  { pattern: /architectural\s+(flaw|debt|issue)/i,         label: 'architectural issue claim' },
  { pattern: /critical\s+(debt|issue|flaw)/i,               label: 'critical issue claim' },
];

export class HanseiAuditor {
  constructor(
    private fileSystem: FileSystem,
    private rootPath: string,
  ) {}

  async audit(task: Task, changedFilePaths: string[]): Promise<HanseiAuditResult> {
    const details: string[] = [];
    const hansei = task.hansei;

    if (!hansei) {
      return { taskId: task.id, verdict: 'PASS', details: [] };
    }

    // --- Under-declaration (Concealment) check ---
    const foundPatterns: string[] = [];

    for (const filePath of changedFilePaths) {
      // Only scan implementation files — skip docs, markdown, config
      if (!this.isImplementationFile(filePath)) continue;

      let content: string;
      try {
        content = await this.fileSystem.readFile(`${this.rootPath}/${filePath}`);
      } catch {
        continue;
      }

      for (const { pattern, label } of CONCEALMENT_PATTERNS) {
        // Skip console.log check for CLI infrastructure files
        if (label.includes('console.log') && this.isCLIFile(filePath)) continue;

        const matches = content.match(pattern);
        if (matches) {
          foundPatterns.push(`${label} in ${filePath} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`);
        }
      }
    }

    // If patterns found, check if Hansei declares them
    if (foundPatterns.length > 0) {
      const declared = this.isDebtDeclared(hansei, foundPatterns);
      if (!declared) {
        details.push(`[CONCEALMENT] Undeclared debt detected in changed files:`);
        foundPatterns.forEach(p => details.push(`  · ${p}`));
        details.push(`  Hansei declares: severity=${hansei.severity}, category=${hansei.category}`);
        details.push(`  Reclassify as [AuditGap] H3a and REJECT.`);
        return {
          taskId: task.id,
          verdict: 'CONCEALMENT',
          severity: 'H3a',
          category: '[AuditGap]',
          details,
        };
      }
    }

    // --- Over-declaration (Inflation) check ---
    if (hansei.severity === 'H2' || hansei.severity === 'H3a' || hansei.severity === 'H3b') {
      const hanseiText = [hansei.decision, hansei.constraint, hansei.cost, hansei.forwardAction].join(' ');

      const inflationSignals = INFLATION_TRIGGERS.filter(({ pattern }) => pattern.test(hanseiText));

      // If severity is H2+ but no concealment patterns found, check for inflation
      if (foundPatterns.length === 0 && changedFilePaths.length > 0) {
        const allSmall = changedFilePaths.every(f => this.isSmallScope(f));
        if (allSmall && hansei.severity !== 'H1') {
          details.push(`[INFLATION] Hansei severity ${hansei.severity} declared for changes scoped to: ${changedFilePaths.join(', ')}`);
          details.push(`  No debt patterns found in implementation files.`);
          if (inflationSignals.length > 0) {
            inflationSignals.forEach(({ label }) => details.push(`  · Defensive signal detected: ${label}`));
          }
          details.push(`  Downgrade severity to H1 (minor deviation) per Anti-Goodhart logic.`);
          return {
            taskId: task.id,
            verdict: 'INFLATION',
            severity: 'H1',
            category: '[ProcessViolation]',
            details,
          };
        }
      }
    }

    return { taskId: task.id, verdict: 'PASS', details: [] };
  }

  // Extract changed file paths from a task's Hansei forwardAction or from git diff
  static extractChangedFiles(taskContent: string): string[] {
    const files: string[] = [];

    // Look for file: predicates in ACs
    const filePredicates = taskContent.match(/`file:\s*([^`]+)`/g) ?? [];
    for (const pred of filePredicates) {
      const m = pred.match(/`file:\s*([^`]+)`/);
      if (m) files.push(m[1].trim());
    }

    // Look for changed files in REVIEW_REQUEST section
    const changedMatch = taskContent.match(/Changed files:\s*([\s\S]*?)(?=\n##|$)/m);
    if (changedMatch) {
      const lines = changedMatch[1].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      files.push(...lines);
    }

    return [...new Set(files)];
  }

  private isDebtDeclared(hansei: Task['hansei'], patterns: string[]): boolean {
    if (!hansei) return false;
    const fullText = [hansei.decision, hansei.constraint, hansei.cost, hansei.forwardAction].join(' ').toLowerCase();

    // Check if any common debt-acknowledging terms are present
    const debtKeywords = ['any', 'hack', 'fixme', 'todo', 'suppress', 'ignore', 'cast', 'workaround', 'technical debt', 'shortcut'];
    const hasDebtAcknowledgement = debtKeywords.some(kw => fullText.includes(kw));

    // Severity H1+ is considered an implicit acknowledgement for minor patterns
    if (hasDebtAcknowledgement && hansei.severity !== 'H0') return true;

    // H0 with debt patterns is always concealment
    if (hansei.severity === 'H0' && patterns.length > 0) return false;

    return hasDebtAcknowledgement;
  }

  private isImplementationFile(filePath: string): boolean {
    return /\.(ts|js|py|go|rs|java|kt|rb|c|cpp|cs)$/.test(filePath) &&
      !filePath.includes('/test/') &&
      !filePath.includes('.test.') &&
      !filePath.includes('.spec.');
  }

  private isCLIFile(filePath: string): boolean {
    return filePath.includes('infrastructure/cli') ||
      filePath.includes('commands/') ||
      filePath.includes('index.ts');
  }

  private isSmallScope(filePath: string): boolean {
    // Heuristic: single file in a leaf directory = small scope
    return !filePath.includes('*') && filePath.split('/').length <= 5;
  }
}
