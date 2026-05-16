import type { FileSystem } from '../../domain/repositories/file-system.js';
import { ReflectInfluenceReport, DEFAULT_THRESHOLDS } from '../use-cases/reflect-influence-report.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export class ReflectCommand {
  constructor(private fileSystem: FileSystem, private rootPath: string) {}

  async execute(args: string[]): Promise<void> {
    const sub = args[0];

    if (!sub || sub === 'run') {
      await this.runAnalysis();
      return;
    }

    if (sub === 'hansei') {
      await this.runHanseiAnalysis(args.slice(1));
      return;
    }

    if (sub === 'influence') {
      const config = await ConfigLoader.load(this.fileSystem);
      const thresholds = {
        ...DEFAULT_THRESHOLDS,
        ...(config.reflect?.thresholds ?? {}),
      };
      const reporter = new ReflectInfluenceReport(this.fileSystem, this.rootPath);
      const report = await reporter.compute(thresholds);
      console.log(ReflectInfluenceReport.format(report, thresholds));
      return;
    }

    console.log([
      'Usage: arch reflect [subcommand]',
      '',
      'Subcommands:',
      '  (none)      Run THINK analysis: regenerate INBOX, surface Kaizen, refine ideas, detect drift',
      '  run         Same as no subcommand',
      '  hansei      LLM-assisted Hansei reconciliation: compare declared vs observed debt in REVIEW tasks',
      '  influence   Epistemic influence report — engagement, attribution, observability gaps',
    ].join('\n'));
  }

  private async runHanseiAnalysis(args: string[]): Promise<void> {
    const taskId = args[0];
    console.log('\n  ARCH — arch reflect --hansei: LLM-assisted Hansei reconciliation');
    console.log('  Authority: analysis only — proposals, never enforcement');
    console.log('  This is THINK mode. Output is ephemeral. No task state will be mutated.\n');

    try {
      // Build the prompt dynamically from REVIEW tasks
      const reviewTasks = await this.getReviewTasks(taskId);
      if (reviewTasks.length === 0) {
        console.log('  No tasks in REVIEW status found.' + (taskId ? ` (filtered to ${taskId})` : ''));
        return;
      }

      const prompt = this.buildHanseiPrompt(reviewTasks);

      const config = JSON.parse(fs.readFileSync('arch.config.json', 'utf8'));
      const clis = config.clis || [];

      for (const cli of clis) {
        const which = spawnSync('which', [cli.bin]);
        if (which.status !== 0) continue;

        // Write prompt to temp file to avoid shell escaping issues
        const tmpFile = `/tmp/arch-hansei-prompt-${Date.now()}.md`;
        fs.writeFileSync(tmpFile, prompt);
        const cmd = cli.template.replace(/\{prompt\}/g, `$(cat ${tmpFile})`);
        const result = spawnSync('sh', ['-c', cmd], { stdio: 'inherit' });
        try { fs.unlinkSync(tmpFile); } catch {}
        process.exit(result.status ?? 0);
      }

      // No CLI available — print the prompt so the human can run it manually
      console.log('  No AI CLI detected. Paste the following into your LLM:\n');
      console.log('─'.repeat(60));
      console.log(prompt);
      console.log('─'.repeat(60));
    } catch (e: any) {
      console.error('Error in arch reflect hansei:', e.message);
      process.exit(1);
    }
  }

  private async getReviewTasks(filterTaskId?: string): Promise<Array<{ id: string; content: string }>> {
    const tasksDir = 'docs/tasks';
    const tasks: Array<{ id: string; content: string }> = [];

    let files: string[] = [];
    try {
      files = fs.readdirSync(tasksDir).filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
    } catch {
      return [];
    }

    for (const file of files) {
      const content = fs.readFileSync(`${tasksDir}/${file}`, 'utf8');
      const idMatch = content.match(/^## (TASK-\d+)/m);
      if (!idMatch) continue;
      const id = idMatch[1];

      if (filterTaskId && id !== filterTaskId) continue;
      if (!content.includes('| REVIEW |') && !content.includes('| REVIEW\n')) continue;

      tasks.push({ id, content });
    }

    return tasks;
  }

  private buildHanseiPrompt(tasks: Array<{ id: string; content: string }>): string {
    const taskSections = tasks.map(({ id, content }) => {
      // Extract key sections for LLM analysis
      const hanseiMatch = content.match(/## Hansei\n([\s\S]*?)(?=\n##|$)/m);
      const acMatch = content.match(/### Acceptance Criteria\n([\s\S]*?)(?=\n###|\n##)/m);
      const hansei = hanseiMatch ? hanseiMatch[1].trim() : 'No Hansei section found.';
      const acs = acMatch ? acMatch[1].trim() : 'No ACs found.';

      // Extract file: predicates to identify changed files
      const fileRefs = (content.match(/`file:\s*([^`]+)`/g) ?? []).map(f => f.replace(/`file:\s*/, '').replace('`', ''));

      return `### ${id}
Changed files: ${fileRefs.join(', ') || 'not specified'}

Acceptance Criteria (summary):
${acs}

Declared Hansei:
${hansei}`;
    }).join('\n\n---\n\n');

    return `# ARCH Hansei Reconciliation — THINK Mode Analysis

You are operating in THINK mode. Your role is analysis only. You do not mutate task state.
You do not approve or reject tasks. You produce proposals and observations.

## Task

For each REVIEW task below, compare the **Declared Hansei** against what you would expect
given the scope and complexity of the Acceptance Criteria and changed files.

Identify:
1. **Concealment signals**: Implementation scope or complexity that is not reflected in the Hansei severity or category. Flag if the task appears to have hidden debt (e.g., ACs touching core systems but Hansei is H0/[no-issue]).
2. **Inflation signals**: Hansei severity that appears disproportionate to the scope of changes. Flag if H2+ is declared for a minor scoped fix with no structural implications.
3. **Well-calibrated**: Hansei accurately reflects the observed complexity.

Format your response as:

**TASK-XXX**: [CONCEALMENT | INFLATION | CALIBRATED]
- Observation: <one sentence>
- Proposed reclassification: <if applicable>

Do not approve, reject, or close tasks. Do not write to any files. Output is ephemeral.

---

## Tasks Under Review

${taskSections}`;
  }

  private async runAnalysis(): Promise<void> {
    const promptFile = 'docs/agents/THINK.md';
    console.log('  ARCH — arch reflect [analysis]: invoking THINK mode');
    console.log('  Purpose: regenerate INBOX, surface Kaizen, refine ideas, detect semantic drift');
    console.log('  Authority: proposals only — never mutates task state, never satisfies policy gates');

    try {
      const config = JSON.parse(fs.readFileSync('arch.config.json', 'utf8'));
      const clis = config.clis || [];

      for (const cli of clis) {
        const which = spawnSync('which', [cli.bin]);
        if (which.status !== 0) continue;

        const cmd = cli.template.replace(/\{prompt\}/g, `$(cat ${promptFile})`);
        const result = spawnSync('sh', ['-c', cmd], { stdio: 'inherit' });
        process.exit(result.status ?? 0);
      }

      console.log('  Note: No AI CLI detected. Showing THINK protocol:');
      console.log(fs.readFileSync(promptFile, 'utf8'));
      process.exit(1);
    } catch (e: any) {
      console.error('Error in arch reflect:', e.message);
      process.exit(1);
    }
  }
}
