import * as fmt from '../../infrastructure/cli/output-formatter.js';
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
import { PathResolver } from '../../domain/services/path-resolver.js';
import fs from 'node:fs';

export class AnalyzeCommand implements Command {
  constructor(private fileSystem: FileSystem, private rootPath: string, private taskRepository?: any) {}

  async execute(args: string[]): Promise<number> {
    const deepMode = args.includes('--deep');
    const filteredArgs = args.filter(a => a !== '--deep');
    const sub = filteredArgs[0];

    if (!sub || sub === 'run') {
      return await this.runAnalysis(deepMode);
    }

    if (sub === 'hansei') {
      return await this.runHanseiAnalysis(args.slice(1));
    }

    if (sub === 'influence') {
      const config = await ConfigLoader.load(this.fileSystem);
      const thresholds = {
        ...DEFAULT_THRESHOLDS,
        ...(config.reflect?.thresholds ?? {}),
      };
      const reporter = new ReflectInfluenceReport(this.fileSystem, this.rootPath);
      const report = await reporter.compute(thresholds);
      fmt.log(ReflectInfluenceReport.format(report, thresholds));
      return 0;
    }

    fmt.log([
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
    return 0;
  }

  private async runHanseiAnalysis(args: string[]): Promise<number> {
    const tier1Only = args.includes('--tier1-only');
    const taskId = args.find(a => /^TASK-\d+$/.test(a));

    fmt.log('\n  ARCH — arch analyze --hansei: Hansei reconciliation');
    fmt.log('  Authority: analysis only — proposals, never enforcement');
    fmt.log('  This is THINK mode. Output is ephemeral. No task state will be mutated.\n');

    let tier1HasFindings = false;

    try {
      const reviewTasks = await this.getReviewTasks(taskId);
      if (reviewTasks.length === 0) {
        fmt.log('  No tasks in REVIEW status found.' + (taskId ? ` (filtered to ${taskId})` : ''));
        return 0;
      }

      // Tier 1 — Deterministic diff-based check (always runs first)
      fmt.log('  ── Tier 1: Deterministic diff analysis (Gating) ────────');
      const { DeterministicHanseiChecker } = await import('../../domain/services/deterministic-hansei-checker.js');
      const checker = new DeterministicHanseiChecker(this.rootPath ?? '.');

      for (const { id, content } of reviewTasks) {
        const task = await this.taskRepository.getById(id);
        if (!task) continue;
        const result = await checker.check(task);
        if (result.skipped) {
          fmt.log(`  [TIER1] ${id}: skipped (no lockedCommit baseline)`);
          continue;
        }
        if (result.findings.length === 0) {
          fmt.log(`  [TIER1] ${id}: ✔ clean`);
        } else {
          tier1HasFindings = true;
          const undeclared = result.findings.filter(f => !f.declaredInHansei);
          const declared = result.findings.filter(f => f.declaredInHansei);
          for (const f of undeclared) {
            fmt.log(`  [TIER1-DRIFT] ${id}: ${f.pattern} in ${f.file}:${f.line}`);
            fmt.log(`    ${f.detail}`);
            fmt.log(`    → Not declared in Hansei Constraint/Cost. Suggested severity: ${undeclared.length > 1 ? 'H3a' : 'H2'}`);
          }
          for (const f of declared) {
            fmt.log(`  [TIER1-OK] ${id}: ${f.pattern} in ${f.file}:${f.line} — declared in Hansei ✔`);
          }
        }
      }
      fmt.log('');

      if (tier1Only) {
        fmt.log('  --tier1-only: skipping Advisory Tier 2.');
        return tier1HasFindings ? 1 : 0;
      }

      // If Tier 1 found undeclared drift, we STILL exit with 1 but may show Tier 2 for context.
      // Per ADR-023, Tier 1 is the machine authority.
    } catch (e: any) {
      fmt.error('Error in arch analyze hansei (Tier 1):', e.message);
      return 1;
    }

    // Tier 2 — Advisory (LLM-assisted — strictly non-authoritative)
    // Per ADR-023: Advisory outputs possess zero machine authority. Exit code is always 0.
    try {
      fmt.log('  ── Tier 2: Advisory analysis (Non-Gating) ──────────────');
      fmt.log('  ADVISORY — informational only. This analysis is not a governance gate.');
      
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
        fmt.log('  No AI CLI detected. Paste the following into your LLM for advisory analysis:\n');
        fmt.log('─'.repeat(60));
        fmt.log(prompt);
        fmt.log('─'.repeat(60));
      }
    } catch (e: any) {
      fmt.log(`  (Note: Advisory analysis failed: ${e.message})`);
    }

    // Final machine authority transition
    return tier1HasFindings ? 1 : 0;
  }

  private async getReviewTasks(filterTaskId?: string): Promise<Array<{ id: string; content: string }>> {
    const tasksDir = PathResolver.from({}).tasks;
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

  private async runAnalysis(deepMode = false): Promise<number> {
    const promptFile = 'docs/agents/THINK.md';
    // AC4: Surface weak signal warnings before THINK invocation
    try {
      const nodefs = new NodeFileSystem();
      const signalLog = new CausalSignalLog(nodefs, '.');
      const aggregates = await aggregateHanseiSignals(signalLog);
      const weakSignals = aggregates.filter(a => a.isWeakSignal);
      if (weakSignals.length > 0) {
        fmt.log('\n  ⚠  Weak Signal Alert (H2+ category appears ≥' + WEAK_SIGNAL_THRESHOLD + 'x):');
        for (const ws of weakSignals) {
          fmt.log(`    ${ws.category.padEnd(28)} ${ws.count}x — systemic friction detected`);
        }
        fmt.log('');
      }
    } catch { /* non-blocking */ }

    // Temporal pattern spikes — surface before LLM synthesis
    try {
      const { TemporalIndex } = await import('../use-cases/temporal-index.js');
      const nodefs = new NodeFileSystem();
      const temporalIdx = new TemporalIndex(nodefs, '.');
      const spikes = await temporalIdx.detectSpikes();
      if (spikes.length > 0) {
        fmt.log('\n  ⚡ Temporal Pattern Analysis:');
        for (const spike of spikes) {
          fmt.log(`    [REFLECT-SUGGESTS] ${spike.label} recurred ${spike.count}x in last 20 completions — consider structural intervention`);
          fmt.log(`      Tasks: ${spike.taskIds.join(', ')}`);
        }
        fmt.log('');
      }
    } catch { /* non-blocking */ }

    // Deterministic synthesis: always runs, no AI required
    try {
      const { HanseiSynthesizer } = await import('../use-cases/hansei-synthesizer.js');
      const synthesizer = new HanseiSynthesizer(new NodeFileSystem(), undefined as any, '.');
      await synthesizer.run();
    } catch (e: any) {
      fmt.log(`  Note: Hansei synthesis skipped (${e.message})`);
    }

    // Alignment audit: advisory only — surfaces emergent patterns to INBOX with [ADVISORY] prefix
    try {
      const { AuditCommand } = await import('./audit-command.js');
      const auditor = new AuditCommand();
      const result = await (auditor as any).runQuiet('.');
      if (result.emergentCount > 0) {
        const fs = new NodeFileSystem();
        const inboxPath = PathResolver.from({}).inbox;
        const inbox = await fs.readFile(inboxPath).catch(() => '');
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const alerts = result.emergent
          .map((e: any) => `[ADVISORY][EMERGENT] ${e.subject}: ${e.description}`)
          .join('\n');
        await fs.writeFile(inboxPath, (inbox.trimEnd()) + `\n\n## ${now} — Alignment Audit (Advisory)\n<!-- These entries are advisory only — not governance gates. Source: arch analyze -->\nAlignment: ${result.score}/100\n${alerts}\n`);
        fmt.log(`  ⚡ Alignment audit: ${result.score}/100, ${result.emergentCount} emergent pattern(s) → INBOX [ADVISORY]`);
      } else {
        fmt.log(`  ✔ Alignment audit: ${result.score}/100`);
      }
    } catch { /* non-blocking — no ADRs, not a git repo, etc. */ }

    // Promotion proposals: scan IDEA files, surface missing fields, write AWAITING_PROMOTION to INBOX
    try {
      const { PromotionProposalGenerator } = await import('../../domain/services/promotion-proposal-generator.js');
      const generator = new PromotionProposalGenerator();

      // AC3: Write AWAITING_PROMOTION to INBOX for undecided IDEA files
      await this.writeAwaitingPromotionToInbox(generator);

      const proposals = generator.generateAll();
      if (proposals.length > 0) {
        fmt.log('\n  ── Promotion Proposals (Advisory) ─────────────────');
        fmt.log('  Labeled: preparation only — not a decision. Human Decision field required.\n');
        for (const p of proposals) {
          // AC4: Report missing fields explicitly instead of generating placeholder ACs
          if (p.missingFields && p.missingFields.length > 0) {
            fmt.log(`  IDEA-${p.ideaSlug}: missing ${p.missingFields.join(', ')}`);
          }
          fmt.log(generator.formatProposal(p));
        }
      }
    } catch { /* non-blocking — proposals are advisory */ }

    fmt.log('  ARCH — arch analyze [analysis]: invoking THINK mode');
    fmt.log('  Purpose: regenerate INBOX, surface Kaizen, refine ideas, detect semantic drift');
    fmt.log('  Authority: proposals only — never mutates task state, never satisfies policy gates');

    try {
      const config = JSON.parse(fs.readFileSync('arch.config.json', 'utf8'));
      const thinkContent = fs.readFileSync(promptFile, 'utf8');
      const modePreamble = deepMode ? '<!-- MODE: DEEP -->\n' : '<!-- MODE: DEFAULT -->\n';
      const prompt = modePreamble + thinkContent;

      // Write to a temp file so CLI templates using $(cat file) work correctly
      const tmpPath = `${PathResolver.from({}).archDir}/.think-prompt-${Date.now()}.md`;
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
          return 0;
        }
      } finally {
        try { fs.unlinkSync(tmpPath); } catch {}
      }

      fmt.log('  Note: No AI CLI detected. Showing THINK protocol:');
      fmt.log(prompt);
      return 0; // Advisory fallback
    } catch (e: any) {
      fmt.error('Error in arch analyze (Advisory):', e.message);
      return 0; // Error in advisory channel does not fail governance
    }
  }

  /** AC3: For each IDEA in refinement/ with no Decision, append AWAITING_PROMOTION to INBOX (idempotent). */
  private async writeAwaitingPromotionToInbox(generator: any): Promise<void> {
    try {
      const { PathResolver } = await import('../../domain/services/path-resolver.js');
      const inboxPath = PathResolver.from({}).inbox;
      const nodefs = new (await import('../../infrastructure/filesystem/node-file-system.js')).NodeFileSystem();

      const ideas = generator.scanIdeas();
      const undecided = ideas.filter((e: any) => !e.metadata.hasDecision);
      if (undecided.length === 0) return;

      const inboxContent = await nodefs.readFile(inboxPath).catch(() => '');

      const lines: string[] = [];
      for (const entry of undecided) {
        const slug = entry.slug;
        // Idempotency: skip if already present in INBOX
        if (inboxContent.includes(`AWAITING_PROMOTION | IDEA-${slug}`)) continue;
        const missingNote = entry.metadata.missingFields.length > 0
          ? ` (missing: ${entry.metadata.missingFields.join(', ')})`
          : '';
        lines.push(`AWAITING_PROMOTION | IDEA-${slug} | ${new Date().toISOString().slice(0, 10)}${missingNote} — no Decision field set`);
      }

      if (lines.length > 0) {
        const updated = (inboxContent.trimEnd()) + '\n\n' + lines.join('\n') + '\n';
        await nodefs.writeFile(inboxPath, updated);
        fmt.log(`  ✔ ${lines.length} AWAITING_PROMOTION entr${lines.length === 1 ? 'y' : 'ies'} written to INBOX`);
      }
    } catch {
      // non-blocking
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
      const ledgerPath = PathResolver.from({}).focusLedger;
      if (!(await this.fileSystem.exists(ledgerPath))) return 0;
      const content = await this.fileSystem.readFile(ledgerPath);
      const state = parseLedger(content);
      return state.lastCommittedTick;
    } catch {
      return 0;
    }
  }
}
