import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import type { Task } from '../../domain/models/task.js';

// Valid categories from ADR-019
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

export class HanseiWizard {
  /**
   * Returns true when all 6 required Hansei fields are present and substantive.
   * This is the canonical trigger condition — not task size or turn count.
   */
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
    const idx = content.indexOf('## Hansei');
    if (idx === -1) return null;
    const start = content.indexOf('\n', idx) + 1;
    const end = content.indexOf('\n## ', start);
    return end === -1 ? content.slice(start) : content.slice(start, end);
  }

  /**
   * Runs the interactive Socratic wizard. Requires a TTY context.
   * Returns the completed ## Hansei block as a string.
   */
  async run(task: Task): Promise<string> {
    const rl = readline.createInterface({ input: stdin, output: stdout });

    try {
      console.log('\n  ── Hansei Wizard ──────────────────────────────────────');
      console.log(`  Task: ${task.id} — ${task.title}`);
      if (task.size) console.log(`  Size: ${task.size}`);
      console.log('  ────────────────────────────────────────────────────────\n');

      // Q1: Severity
      console.log('  1. Severity — what level of issue occurred?\n');
      SEVERITIES.forEach((s, i) => console.log(`     ${i + 1}. ${s.value}  ${s.label}`));
      const sevIdx = await this.askNumber(rl, '\n  Select (1-5): ', 1, 5);
      const severity = SEVERITIES[sevIdx - 1].value;

      // Q2: Category
      console.log('\n  2. Category — what type of issue is this?\n');
      CATEGORIES.forEach((c, i) => console.log(`     ${String(i + 1).padStart(2)}. ${c.value.padEnd(26)} ${c.label}`));
      const catIdx = await this.askNumber(rl, `\n  Select (1-${CATEGORIES.length}): `, 1, CATEGORIES.length);
      const category = CATEGORIES[catIdx - 1].value;

      // Q3: Decision
      const decision = await this.askText(rl,
        '\n  3. Decision — what happened? (one sentence, min 15 chars)\n  > ',
        15, 'Decision'
      );

      // Q4: Constraint
      const constraint = await this.askText(rl,
        '\n  4. Constraint — what limitation did you discover? ("None encountered" is acceptable)\n  > ',
        10, 'Constraint'
      );

      // Q5: Cost
      const cost = await this.askText(rl,
        '\n  5. Cost — what debt was introduced, if any? ("None introduced" is acceptable)\n  > ',
        10, 'Cost'
      );

      // Q6: Forward Action
      const forwardAction = await this.askText(rl,
        '\n  6. Forward Action — what should happen next? ("None required" is acceptable)\n  > ',
        5, 'Forward Action'
      );

      console.log('\n  ✔ Hansei complete.\n');

      return this.format({ severity, category, decision, constraint, cost, forwardAction });
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

  private async askNumber(rl: readline.Interface, prompt: string, min: number, max: number): Promise<number> {
    while (true) {
      const answer = await rl.question(prompt);
      const n = parseInt(answer.trim(), 10);
      if (!isNaN(n) && n >= min && n <= max) return n;
      console.log(`  Please enter a number between ${min} and ${max}.`);
    }
  }

  private async askText(rl: readline.Interface, prompt: string, minLen: number, fieldName: string): Promise<string> {
    while (true) {
      const answer = await rl.question(prompt);
      const val = answer.trim();
      if (val.length >= minLen) return val;
      console.log(`  ${fieldName} must be at least ${minLen} characters.`);
    }
  }
}
