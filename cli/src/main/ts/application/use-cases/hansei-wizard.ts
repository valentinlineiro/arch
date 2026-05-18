import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import type { Task } from '../../domain/models/task.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import { DeterministicHanseiChecker } from '../../domain/services/deterministic-hansei-checker.js';

const out = (msg: string) => stdout.write(msg + '\n');

const CATEGORIES = [
  { value: '[TypeHack]',               label: 'Type hack to bypass TS' },
  { value: '[LeakyAbstraction]',       label: 'Abstraction boundary violated' },
  { value: '[DeferredTest]',           label: 'Test intentionally skipped' },
  { value: '[ContextWaste]',           label: 'Unnecessary context loaded' },
  { value: '[SymbolDiscovery]',        label: 'API discovered at runtime' },
  { value: '[HiddenDependency]',       label: 'Implicit coupling found' },
  { value: '[SpecDrift]',              label: 'Implementation diverged from spec' },
  { value: '[ProcessViolation]',       label: 'Protocol step skipped' },
  { value: '[PrematureOptimization]',  label: 'Optimization without evidence' },
  { value: '[ReviewBlindspot]',        label: 'Gap missed in review' },
  { value: '[MissingDecisionRecord]',  label: 'Decision made without ADR' },
  { value: '[ProvenanceBreak]',        label: 'Evidence chain broken' },
  { value: '[IntegrityCorruption]',    label: 'State became inconsistent' },
  { value: '[FailOpenBehavior]',       label: 'System continued despite error' },
  { value: '[AuditGap]',              label: 'Audit trail incomplete' },
];

const SEVERITIES = [
  { value: 'H0',  label: 'No issue — happy path' },
  { value: 'H1',  label: 'Minor deviation — no action needed' },
  { value: 'H2',  label: 'Pattern worth tracking — link IDEA in Forward Action' },
  { value: 'H3a', label: 'Task must be rejected and reworked before closing' },
  { value: 'H3b', label: 'Systemic risk — requires owner and expiry' },
];

export interface HanseiBlock {
  severity: string;
  category: string;
  decision: string;
  constraint: string;
  cost: string;
  forwardAction: string;
}

// Map Tier 1 finding patterns → category
function inferCategory(patterns: string[]): string {
  for (const p of patterns) {
    if (p.includes('any') || p.includes('ts-ignore')) return '[TypeHack]';
    if (p.includes('TODO') || p.includes('FIXME') || p.includes('HACK')) return '[AuditGap]';
    if (p.includes('console.log')) return '[AuditGap]';
    if (p.includes('outside declared context') || p.includes('context path')) return '[SpecDrift]';
    if (p.includes('dependency') || p.includes('import')) return '[HiddenDependency]';
  }
  return '[SpecDrift]';
}

// Map finding count → severity
function inferSeverity(findingCount: number): string {
  if (findingCount === 0) return 'H0';
  if (findingCount === 1) return 'H1';
  if (findingCount <= 3) return 'H2';
  return 'H3a';
}

export class HanseiWizard {
  static isHanseiComplete(content: string): boolean {
    const section = HanseiWizard.extractHanseiSection(content);
    if (!section) return false;

    const PLACEHOLDER = /^(not yet started|none\.|tbd|todo)$/i;
    const severity = section.match(/\*\*Severity:\*\*\s*(\S+)/)?.[1];
    const category = section.match(/\*\*Category:\*\*\s*(\S+)/)?.[1];
    const textFields = [
      section.match(/\*\*Decision:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim(),
      section.match(/\*\*Constraint:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim(),
      section.match(/\*\*Cost:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim(),
      section.match(/\*\*Forward Action:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/)?.[1]?.trim(),
    ];

    if (!severity || !category) return false;
    if (PLACEHOLDER.test(severity) || PLACEHOLDER.test(category)) return false;
    return textFields.every(f => f && f.length >= 10 && !PLACEHOLDER.test(f));
  }

  private static extractHanseiSection(content: string): string | null {
    const idx = content.lastIndexOf('## Hansei');
    if (idx === -1) return null;
    const start = content.indexOf('\n', idx) + 1;
    const end = content.indexOf('\n## ', start);
    return end === -1 ? content.slice(start) : content.slice(start, end);
  }

  async run(task: Task, gitRepository?: GitRepository): Promise<string> {
    const rl = readline.createInterface({ input: stdin, output: stdout });

    try {
      out('\n  ── Hansei Wizard ──────────────────────────────────────');
      out(`  Task: ${task.id} — ${task.title}`);

      // Run Tier 1 deterministic scan to pre-fill fields
      let inferredSeverity = 'H0';
      let inferredCategory = '[no-issue]';
      let inferredConstraint = 'None encountered.';
      let inferredCost = 'No architectural debt introduced.';
      let inferredForwardAction = 'None required.';
      let findingSummary = '';

      if (gitRepository && task.lockedCommit) {
        try {
          const checker = new DeterministicHanseiChecker(gitRepository);
          const result = await checker.run(task);

          if (result.findings.length > 0) {
            const patterns = result.findings.map(f => f.pattern);
            inferredSeverity = inferSeverity(result.findings.length);
            inferredCategory = inferCategory(patterns);
            findingSummary = result.findings.map(f =>
              `    [TIER1] ${f.pattern} in ${f.file}:${f.line}`
            ).join('\n');
            inferredConstraint = result.findings.map(f => f.pattern).join('; ') + ' — detected by Tier 1 scan.';
            if (!result.findings.every(f => f.declaredInHansei)) {
              inferredCost = `${result.findings.length} undeclared drift finding(s). See constraint.`;
              inferredForwardAction = 'Review Tier 1 findings. Consider filing an IDEA if pattern recurs.';
            }
          }
        } catch { /* non-blocking — proceed with defaults */ }
      }

      // Show inferred values
      out(`\n  Pre-filled from diff scan:`);
      out(`    Severity:       ${inferredSeverity}`);
      out(`    Category:       ${inferredCategory}`);
      out(`    Constraint:     ${inferredConstraint.slice(0, 60)}`);
      out(`    Cost:           ${inferredCost.slice(0, 60)}`);
      out(`    Forward Action: ${inferredForwardAction.slice(0, 60)}`);
      if (findingSummary) {
        out(`\n  Findings:\n${findingSummary}`);
      }
      out('  ────────────────────────────────────────────────────────\n');

      // Only ask: confirm/override severity+category, then write the Decision
      const sevAnswer = await rl.question(
        `  Severity [${inferredSeverity}] — press Enter to accept or type H0/H1/H2/H3a/H3b: `
      );
      const severity = sevAnswer.trim() || inferredSeverity;

      const catAnswer = await rl.question(
        `  Category [${inferredCategory}] — press Enter to accept or type category: `
      );
      const category = catAnswer.trim() || inferredCategory;

      // The one mandatory human field
      const decision = await this.askText(rl,
        '\n  Decision — what constraint did you discover that wasn\'t in the spec?\n  (This is the only field that can\'t be inferred)\n  > ',
        15, 'Decision'
      );

      out('\n  ✔ Hansei complete.\n');

      return this.format({
        severity,
        category,
        decision,
        constraint: inferredConstraint,
        cost: inferredCost,
        forwardAction: inferredForwardAction,
      });

    } finally {
      rl.close();
    }
  }

  format(block: HanseiBlock): string {
    return [
      '## Hansei',
      `**Severity:** ${block.severity}`,
      `**Category:** ${block.category}`,
      `**Decision:** ${block.decision}`,
      `**Constraint:** ${block.constraint}`,
      `**Cost:** ${block.cost}`,
      `**Forward Action:** ${block.forwardAction}`,
    ].join('\n') + '\n';
  }

  private async askText(rl: readline.Interface, prompt: string, minLen: number, fieldName: string): Promise<string> {
    while (true) {
      const answer = await rl.question(prompt);
      const val = answer.trim();
      if (val.length >= minLen) return val;
      out(`  ${fieldName} must be at least ${minLen} characters.`);
    }
  }
}
