import { Command } from '../../domain/models/command.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { CausalSignalLog } from '../use-cases/causal-signal-log.js';
import { aggregateHanseiSignals, WEAK_SIGNAL_THRESHOLD } from '../../domain/services/signal-router.js';
import { NodeFileSystem } from '../../infrastructure/filesystem/node-file-system.js';
import { ReflectInfluenceReport, DEFAULT_THRESHOLDS } from '../use-cases/reflect-influence-report.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { writeDeepAnalysisState } from '../use-cases/deep-analysis-state.js';
import { parseLedger } from '../use-cases/focus-ledger.js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export class AnalyzeCommand implements Command {
  constructor(private fileSystem: FileSystem, private rootPath: string, private taskRepository?: any) {}

  async execute(args: string[]): Promise<void> {
    const deepMode = args.includes('--deep');
    const filteredArgs = args.filter(a => a !== '--deep');
    const sub = filteredArgs[0];

    if (!sub || sub === 'run') {
      await this.runAnalysis(deepMode);
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
      'Usage: arch analyze [--deep] [subcommand]',
      '',
      'Flags:',
      '  --deep      Run full analysis including Phase 2.5 and Phase 3 (cadence-gated)',
      '',
      'Subcommands:',
      '  (none)      Run THINK analysis (DEFAULT mode: Phase 1 + Phase 2 execution only)',
      '  run         Same as no subcommand',
      '  hansei      LLM-assisted Hansei reconciliation: compare declared vs observed debt in REVIEW tasks',
      '  influence   Epistemic influence report — engagement, attribution, observability gaps',
    ].join('\n'));
  }

  private async runHanseiAnalysis(args: string[]): Promise<void> {
    const tier1Only = args.includes('--tier1-only');
    const taskId = args.find(a => /^TASK-\d+$/.test(a));

    console.log('\n  ARCH — arch analyze --hansei: Hansei reconciliation');
    console.log('  Authority: analysis only — proposals, never enforcement');
    console.log('  This is THINK mode. Output is ephemeral. No task state will be mutated.\n');

    let tier1HasFindings = false;

    try {
      const reviewTasks = await this.getReviewTasks(taskId);
      if (reviewTasks.length === 0) {
        console.log('  No tasks in REVIEW status found.' + (taskId ? ` (filtered to ${taskId})` : ''));
        return;
      }

      // Tier 1 — Deterministic diff-based check (always runs first)
      console.log('  ── Tier 1: Deterministic diff analysis (Gating) ────────');
      const { DeterministicHanseiChecker } = await import('../../domain/services/deterministic-hansei-checker.js');
      const checker = new DeterministicHanseiChecker(this.rootPath ?? '.');

      for (const { id, content } of reviewTasks) {
        const task = await this.taskRepository.getById(id);
        if (!task) continue;
        const result = await checker.check(task);
        if (result.skipped) {
          console.log(`  [TIER1] ${id}: skipped (no lockedCommit baseline)`);
          continue;
        }
        if (result.findings.length === 0) {
          console.log(`  [TIER1] ${id}: ✔ clean`);
        } else {
          tier1HasFindings = true;
          const undeclared = result.findings.filter(f => !f.declaredInHansei);
          const declared = result.findings.filter(f => f.declaredInHansei);
          for (const f of undeclared) {
            console.log(`  [TIER1-DRIFT] ${id}: ${f.pattern} in ${f.file}:${f.line}`);
            console.log(`    ${f.detail}`);
            console.log(`    → Not declared in Hansei Constraint/Cost. Suggested severity: ${undeclared.length > 1 ? 'H3a' : 'H2'}`);
          }
          for (const f of declared) {
            console.log(`  [TIER1-OK] ${id}: ${f.pattern} in ${f.file}:${f.line} — declared in Hansei ✔`);
          }
        }
      }
      console.log('');

      if (tier1Only) {
        console.log('  --tier1-only: skipping Advisory Tier 2.');
        process.exit(tier1HasFindings ? 1 : 0);
        return;
      }

      // If Tier 1 found undeclared drift, we STILL exit with 1 but may show Tier 2 for context.
      // Per ADR-023, Tier 1 is the machine authority.
    } catch (e: any) {
      console.error('Error in arch analyze hansei (Tier 1):', e.message);
      process.exit(1);
    }

    // Tier 2 — Advisory (LLM-assisted — strictly non-authoritative)
    // Per ADR-023: Advisory outputs possess zero machine authority. Exit code is always 0.
    try {
      console.log('  ── Tier 2: Advisory analysis (Non-Gating) ──────────────');
      console.log('  ADVISORY — informational only. This analysis is not a governance gate.');
      
      const reviewTasks = await this.getReviewTasks(taskId);
      const prompt = this.buildHanseiPrompt(reviewTasks);
      const config = JSON.parse(fs.readFileSync('arch.config.json', 'utf8'));
      const clis = config.clis || [];

      let advisoryExecuted = false;
      for (const cli of clis) {
        const which = spawnSync('which', [cli.bin]);
        if (which.status !== 0) continue;

        const tmpFile = `/tmp/arch-hansei-prompt-${Date.now()}.md`;
        fs.writeFileSync(tmpFile, prompt);
        const cmd = cli.template.replace(/\{prompt\}/g, `$(cat ${tmpFile})`);
        
        spawnSync('sh', ['-c', cmd], { stdio: 'inherit' });
        
        try { fs.unlinkSync(tmpFile); } catch {}
        advisoryExecuted = true;
        break;
      }

      if (!advisoryExecuted) {
        console.log('  No AI CLI detected. Paste the following into your LLM for advisory analysis:\n');
        console.log('─'.repeat(60));
        console.log(prompt);
        console.log('─'.repeat(60));
      }
    } catch (e: any) {
      console.log(`  (Note: Advisory analysis failed: ${e.message})`);
    }

    // Final machine authority transition
    process.exit(tier1HasFindings ? 1 : 0);
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

    return `# ARCH Hansei Reconciliation — ADVISORY ONLY

You are operating in ADVISORY mode. Your role is analysis only. 
CRITICAL: You possess zero machine authority. Your findings are informational.
You do not mutate task state. You do not block state transitions.

## Task

For each REVIEW task below, compare the **Declared Hansei** against what you would expect
given the scope and complexity of the Acceptance Criteria and changed files.

Identify:
1. **Concealment signals**: Implementation scope or complexity that is not reflected in the Hansei severity or category.
2. **Inflation signals**: Hansei severity that appears disproportionate to the scope of changes.
3. **Well-calibrated**: Hansei accurately reflects the observed complexity.

Format your response as:

**TASK-XXX**: [CONCEALMENT | INFLATION | CALIBRATED]
- Observation: <one sentence>
- Proposed reclassification: <if applicable>

Output is for human attention only. Do not attempt to command state transitions.

---

## Tasks Under Review

${taskSections}`;
  }

  private async runAnalysis(deepMode = false): Promise<void> {
    const promptFile = 'docs/agents/THINK.md';
    // AC4: Surface weak signal warnings before THINK invocation
    try {
      const nodefs = new NodeFileSystem();
      const signalLog = new CausalSignalLog(nodefs, '.');
      const aggregates = await aggregateHanseiSignals(signalLog);
      const weakSignals = aggregates.filter(a => a.isWeakSignal);
      if (weakSignals.length > 0) {
        console.log('\n  ⚠  Weak Signal Alert (H2+ category appears ≥' + WEAK_SIGNAL_THRESHOLD + 'x):');
        for (const ws of weakSignals) {
          console.log(`    ${ws.category.padEnd(28)} ${ws.count}x — systemic friction detected`);
        }
        console.log('');
      }
    } catch { /* non-blocking */ }

    // Temporal pattern spikes — surface before LLM synthesis
    try {
      const { TemporalIndex } = await import('../use-cases/temporal-index.js');
      const nodefs = new NodeFileSystem();
      const temporalIdx = new TemporalIndex(nodefs, '.');
      const spikes = await temporalIdx.detectSpikes();
      if (spikes.length > 0) {
        console.log('\n  ⚡ Temporal Pattern Analysis:');
        for (const spike of spikes) {
          console.log(`    [REFLECT-SUGGESTS] ${spike.label} recurred ${spike.count}x in last 20 completions — consider structural intervention`);
          console.log(`      Tasks: ${spike.taskIds.join(', ')}`);
        }
        console.log('');
      }
    } catch { /* non-blocking */ }

    // Deterministic synthesis: always runs, no AI required
    try {
      const { HanseiSynthesizer } = await import('../use-cases/hansei-synthesizer.js');
      const synthesizer = new HanseiSynthesizer(new NodeFileSystem(), undefined as any, '.');
      await synthesizer.run();
    } catch (e: any) {
      console.log(`  Note: Hansei synthesis skipped (${e.message})`);
    }

    // Alignment audit: runs on deep cadence, surfaces emergent patterns to INBOX
    try {
      const { AuditCommand } = await import('./audit-command.js');
      const auditor = new AuditCommand();
      const result = await auditor.runQuiet('.');
      if (result.emergentCount > 0) {
        const fs = new NodeFileSystem();
        const inboxPath = 'docs/INBOX.md';
        const inbox = await fs.readFile(inboxPath).catch(() => '');
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const alerts = result.emergent
          .map(e => `[EMERGENT] ${e.subject}: ${e.description}`)
          .join('\n');
        await fs.writeFile(inboxPath, (inbox.trimEnd()) + `\n\n## ${now} — Alignment Audit\nAlignment: ${result.score}/100\n${alerts}\n`);
        console.log(`  ⚡ Alignment audit: ${result.score}/100, ${result.emergentCount} emergent pattern(s) → INBOX`);
      } else {
        console.log(`  ✔ Alignment audit: ${result.score}/100`);
      }
    } catch { /* non-blocking — no ADRs, not a git repo, etc. */ }

    // Promotion proposals: scan IDEA files and generate advisory task drafts
    try {
      const { PromotionProposalGenerator } = await import('../../domain/services/promotion-proposal-generator.js');
      const generator = new PromotionProposalGenerator();
      const proposals = generator.generateAll();
      if (proposals.length > 0) {
        console.log('\n  ── Promotion Proposals (Advisory) ─────────────────');
        console.log('  Labeled: preparation only — not a decision. Human Decision field required.\n');
        for (const p of proposals) {
          console.log(generator.formatProposal(p));
        }
      }
    } catch { /* non-blocking — proposals are advisory */ }

    console.log('  ARCH — arch analyze [analysis]: invoking THINK mode');
    console.log('  Purpose: regenerate INBOX, surface Kaizen, refine ideas, detect semantic drift');
    console.log('  Authority: proposals only — never mutates task state, never satisfies policy gates');

    try {
      const config = JSON.parse(fs.readFileSync('arch.config.json', 'utf8'));
      const thinkContent = fs.readFileSync(promptFile, 'utf8');
      const modePreamble = deepMode ? '<!-- MODE: DEEP -->\n' : '<!-- MODE: DEFAULT -->\n';
      const prompt = modePreamble + thinkContent;

      // Write to a temp file so CLI templates using $(cat file) work correctly
      const tmpPath = `.arch/.think-prompt-${Date.now()}.md`;
      fs.writeFileSync(tmpPath, prompt);

      const clis = config.clis || [];
      try {
        for (const cli of clis) {
          const which = spawnSync('which', [cli.bin]);
          if (which.status !== 0) continue;

          const cmd = cli.template.replace(/\{prompt\}/g, `$(cat ${tmpPath})`);
          
          // Execute Advisory analysis
          spawnSync('sh', ['-c', cmd], { stdio: 'inherit' });

          if (deepMode) {
            await this.updateDeepState();
          }

          try { fs.unlinkSync(tmpPath); } catch {}
          
          // Per ADR-023: Advisory analysis always exits 0
          process.exit(0);
        }
      } finally {
        try { fs.unlinkSync(tmpPath); } catch {}
      }

      console.log('  Note: No AI CLI detected. Showing THINK protocol:');
      console.log(prompt);
      process.exit(0); // Advisory fallback
    } catch (e: any) {
      console.error('Error in arch analyze (Advisory):', e.message);
      process.exit(0); // Error in advisory channel does not fail governance
    }
  }

  private async updateDeepState(): Promise<void> {
    try {
      const tick = await this.getCurrentTick();
      await writeDeepAnalysisState(this.fileSystem, {
        lastDeepRunTick: tick,
        lastDeepRunTimestamp: new Date().toISOString(),
      });
    } catch {
      // non-fatal
    }
  }

  private async getCurrentTick(): Promise<number> {
    try {
      const ledgerPath = '.arch/focus-ledger.jsonl';
      if (!(await this.fileSystem.exists(ledgerPath))) return 0;
      const content = await this.fileSystem.readFile(ledgerPath);
      const state = parseLedger(content);
      return state.lastCommittedTick;
    } catch {
      return 0;
    }
  }
}
