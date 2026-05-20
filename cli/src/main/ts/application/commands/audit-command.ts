import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { GitEvidenceCollector } from '../../infrastructure/git/git-evidence-collector.js';
import { AdrDecisionParser } from '../../infrastructure/git/adr-decision-parser.js';
import { DecisionReconciliationEngine } from '../../domain/services/decision-reconciliation-engine.js';
import { DecisionImpactEngine } from '../../domain/services/decision-impact-engine.js';
import { EpistemicIntegrityService } from '../../domain/services/epistemic-integrity-service.js';
import type { EvidenceEvent } from '../../domain/models/evidence.js';
import type { ImpactAction } from '../../domain/models/action.js';

export class AuditCommand {
  async execute(args: string[]): Promise<void> {
    const target = args[0] ?? '.';
    const verbose = args.includes('--verbose') || args.includes('-v');
    const maxCommits = parseInt(args.find(a => a.startsWith('--commits='))?.split('=')[1] ?? '200');

    let repoPath: string;
    let tmpDir: string | null = null;

    // Resolve target: URL → clone, path → use directly
    if (target.startsWith('https://') || target.startsWith('git@')) {
      console.log(`\n  Cloning ${target}...`);
      tmpDir = mkdtempSync(join(tmpdir(), 'arch-audit-'));
      try {
        execSync(`git clone --depth 200 "${target}" "${tmpDir}"`, { stdio: 'pipe' });
        repoPath = tmpDir;
        console.log(`  Cloned to ${tmpDir}\n`);
      } catch (e: any) {
        rmSync(tmpDir, { recursive: true, force: true });
        process.stderr.write(`  Failed to clone: ${e.message}\n`);
        process.exit(1);
      }
    } else {
      repoPath = resolve(target);
      if (!existsSync(repoPath)) {
        process.stderr.write(`  Path not found: ${repoPath}\n`);
        process.exit(1);
      }
    }

    try {
      await this.runAudit(repoPath, { verbose, maxCommits });
    } finally {
      if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  /** Silent version for govern reflect — returns summary without output. */
  async runQuiet(repoPath: string): Promise<{
    score: number;
    emergentCount: number;
    divergentCount: number;
    emergent: Array<{ subject: string; description: string }>;
  }> {
    try {
      const collector = new GitEvidenceCollector(repoPath);
      const events = await collector.collect({ maxCommits: 100 });
      const parser = new AdrDecisionParser(repoPath);
      const decisions = parser.parse();
      if (decisions.length === 0) return { score: 100, emergentCount: 0, divergentCount: 0, emergent: [] };

      const engine = new DecisionReconciliationEngine();
      const truthReport = engine.reconcile(decisions, events);

      const emergent = (truthReport.unrecordedBehavioralPatterns ?? []).map(e => ({
        subject: e.subject,
        description: e.description ?? '',
      }));

      return {
        score: truthReport.alignmentScore,
        emergentCount: emergent.length,
        divergentCount: (truthReport.topDivergences ?? []).length,
        emergent,
      };
    } catch {
      return { score: 100, emergentCount: 0, divergentCount: 0, emergent: [] };
    }
  }

  private async runAudit(
    repoPath: string,
    opts: { verbose: boolean; maxCommits: number },
  ): Promise<void> {
    const isGitRepo = existsSync(join(repoPath, '.git'));
    const isArchRepo = existsSync(join(repoPath, 'docs/adr')) || existsSync(join(repoPath, 'arch.config.json'));

    console.log(`\n  \x1b[32mARCH\x1b[0m — Repository Audit\n`);
    console.log(`  Path:     ${repoPath}`);
    console.log(`  Git repo: ${isGitRepo ? 'yes' : 'no'}`);
    console.log(`  ARCH:     ${isArchRepo ? 'yes' : 'no'}\n`);

    // ── Stage 1: Collect evidence ─────────────────────────────────────────
    process.stdout.write('  [1/4] Collecting git evidence...');
    let events: EvidenceEvent[] = [];
    if (isGitRepo) {
      const collector = new GitEvidenceCollector(repoPath);
      events = await collector.collect({ maxCommits: opts.maxCommits });
    }
    process.stdout.write(` ${events.length} events\n`);

    // ── Stage 2: Parse decisions from ADRs ───────────────────────────────
    process.stdout.write('  [2/4] Parsing ADR decisions...');
    const parser = new AdrDecisionParser(repoPath);
    const decisions = parser.parse();
    process.stdout.write(` ${decisions.length} decisions\n`);

    // ── Stage 3: Reconcile ───────────────────────────────────────────────
    process.stdout.write('  [3/4] Reconciling decisions against evidence...');
    const engine = new DecisionReconciliationEngine();
    const truthReport = engine.reconcile(decisions, events);
    process.stdout.write(` score: ${truthReport.alignmentScore}\n`);

    // ── Stage 4: Generate remediation plan ──────────────────────────────
    process.stdout.write('  [4/4] Generating impact plan...');
    const impactEngine = new DecisionImpactEngine();
    const plan = impactEngine.generateRemediationPlan(truthReport.topDivergences);
    process.stdout.write(` ${plan.actions.length} actions\n\n`);

    // ── Epistemic integrity check ─────────────────────────────────────────
    const integrityService = new EpistemicIntegrityService();
    const subjectIds = decisions.map(d => d.id);
    const integrityReport = integrityService.analyze(subjectIds, events);

    // ── Render results ────────────────────────────────────────────────────
    this.render({ truthReport, plan, integrityReport, decisions, events, verbose: opts.verbose });

    // Cache audit result for arch status
    try {
      const { writeFileSync, existsSync, mkdirSync } = await import('node:fs');
      const archDir = `${repoPath}/.arch`;
      if (!existsSync(archDir)) mkdirSync(archDir, { recursive: true });
      writeFileSync(`${archDir}/last-audit.json`, JSON.stringify({
        score: truthReport.alignmentScore,
        timestamp: new Date().toISOString(),
        decisions: decisions.length,
        events: events.length,
        emergentCount: (truthReport.unrecordedBehavioralPatterns ?? []).length,
        divergentCount: (truthReport.topDivergences ?? []).length,
      }, null, 2));
    } catch { /* non-blocking */ }
  }

  private render(ctx: {
    truthReport: any;
    plan: any;
    integrityReport: any;
    decisions: any[];
    events: EvidenceEvent[];
    verbose: boolean;
  }): void {
    const { truthReport, plan, decisions, events, verbose } = ctx;
    const alignScore = truthReport.alignmentScore as number;

    const scoreStr = `${alignScore >= 80 ? '\x1b[32m' : alignScore >= 60 ? '\x1b[33m' : '\x1b[31m'}${alignScore}/100\x1b[0m`;

    console.log(`  Alignment Score: ${decisions.length > 0 ? scoreStr : 'n/a (no ADRs found)'}`);
    console.log(`  Decisions:       ${decisions.length} parsed from ADRs`);
    console.log(`  Evidence:        ${events.length} events from git history`);
    console.log(`  Actions:         ${plan.actions.length} suggested\n`);

    const divergent: any[] = truthReport.topDivergences ?? [];
    const stale = (truthReport.reconciledDecisions ?? []).filter((d: any) => d.reconciliationState === 'STALE');
    const emergent: any[] = truthReport.unrecordedBehavioralPatterns ?? [];

    if (divergent.length > 0) {
      console.log(`  \x1b[31m✖ Divergent (${divergent.length}):\x1b[0m`);
      for (const d of divergent.slice(0, 5)) {
        console.log(`    ${d.id}  ${d.title?.slice(0, 60) ?? d.subject}`);
        if (verbose && d.description) console.log(`      → ${d.description.slice(0, 80)}`);
      }
      console.log('');
    }

    if (stale.length > 0) {
      console.log(`  \x1b[33m⚠ Stale decisions (${stale.length}) — no recent evidence:\x1b[0m`);
      for (const d of stale.slice(0, 3)) {
        console.log(`    ${d.id}  ${d.title?.slice(0, 60) ?? d.subject}`);
      }
      console.log('');
    }

    if (emergent.length > 0 && verbose) {
      console.log(`  \x1b[36m~ Emergent patterns (${emergent.length}) — behaviour without ADR:\x1b[0m`);
      for (const d of emergent.slice(0, 3)) {
        console.log(`    ${d.subject}  ${d.description?.slice(0, 60) ?? ''}`);
      }
      console.log('');
    }

    const highActions = plan.actions.filter((a: ImpactAction) => a.priority === 'HIGH');
    if (highActions.length > 0) {
      console.log(`  \x1b[31mHIGH priority actions (${highActions.length}):\x1b[0m`);
      for (const a of highActions.slice(0, 3)) {
        console.log(`    [${a.type}]  ${a.target}`);
        console.log(`    → ${a.description?.slice(0, 80)}`);
      }
      console.log('');
    }

    if (verbose) {
      const medActions = plan.actions.filter((a: ImpactAction) => a.priority === 'MEDIUM');
      if (medActions.length > 0) {
        console.log(`  MEDIUM priority actions (${medActions.length}):`);
        for (const a of medActions.slice(0, 3)) {
          console.log(`    [${a.type}]  ${a.target}  — ${a.description?.slice(0, 60)}`);
        }
        console.log('');
      }
    }

    if (decisions.length === 0) {
      console.log('  \x1b[33m~ No ADRs found. Add docs/adr/ with decision records to enable alignment scoring.\x1b[0m');
    } else if (alignScore >= 80) {
      console.log('  \x1b[32m✔ Repository is well-aligned with its documented decisions.\x1b[0m');
    } else if (alignScore >= 60) {
      console.log('  \x1b[33m⚠ Repository has notable decision drift. Review HIGH priority actions.\x1b[0m');
    } else {
      console.log('  \x1b[31m✖ Repository has significant alignment gaps. Immediate attention required.\x1b[0m');
    }
    console.log('');
  }
}
