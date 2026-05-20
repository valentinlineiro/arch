import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { GitEvidenceCollector } from '../../infrastructure/git/git-evidence-collector.js';
import { AdrDecisionParser } from '../../infrastructure/git/adr-decision-parser.js';
import { DecisionReconciliationEngine } from '../../domain/services/decision-reconciliation-engine.js';
import { DecisionImpactEngine } from '../../domain/services/decision-impact-engine.js';
import { EpistemicIntegrityService } from '../../domain/services/epistemic-integrity-service.js';
import { GitSemanticExtractor } from '../../infrastructure/git/git-semantic-extractor.js';
import { SignalExtractionEngine } from '../../domain/services/signal-extraction-engine.js';
import { NoiseFilter } from '../../domain/services/noise-filter.js';
import { PatternEngine } from '../../domain/services/pattern-engine.js';
import { ADRInferenceEngine } from '../../domain/services/adr-inference-engine.js';
import { InitRecommendationEngine } from '../../domain/services/init-recommendation-engine.js';
import { SignalCache } from '../../infrastructure/filesystem/signal-cache.js';
import { NodeFileSystem } from '../../infrastructure/filesystem/node-file-system.js';
import type { EvidenceEvent } from '../../domain/models/evidence.js';
import type { ImpactAction } from '../../domain/models/action.js';
import type { CachedSignalEntry } from '../../domain/models/audit-inference.js';

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

    // ── Stage 1.5: Semantic Inference (v1.2) ──────────────────────────
    process.stdout.write('  [1.5/4] Inferring semantic patterns...');
    const fs = new NodeFileSystem();
    const cache = new SignalCache(fs, repoPath);
    const cachedEntries = await cache.load();
    
    const { SIGNAL_ENGINE_VERSION } = await import('../../domain/services/signal-extraction-engine.js');
    
    const effectiveCachedEntries = cachedEntries.length > 0 && cachedEntries[0].engineVersion === SIGNAL_ENGINE_VERSION
      ? cachedEntries
      : [];
    
    if (effectiveCachedEntries.length === 0 && cachedEntries.length > 0) {
      process.stdout.write(' (cache invalidated)');
      await cache.clear();
    }

    const lastCommitHash = effectiveCachedEntries.length > 0 ? effectiveCachedEntries[effectiveCachedEntries.length - 1].commit : undefined;
    const semanticExtractor = new GitSemanticExtractor(repoPath);
    const newChunks = await semanticExtractor.extractChunks({ maxCommits: opts.maxCommits, since: lastCommitHash });
    
    const signalEngine = new SignalExtractionEngine();
    const noiseFilter = new NoiseFilter();
    
    const newEntries: CachedSignalEntry[] = [];
    for (const chunk of newChunks) {
      if (noiseFilter.shouldIgnore(chunk.file)) continue;
      const signals = signalEngine.extract(chunk);
      if (signals.length > 0) {
        newEntries.push({
          commit: chunk.commit,
          file: chunk.file,
          timestamp: chunk.timestamp,
          signals,
          hash: createHash('sha256').update(chunk.addedLines.join('\n') + chunk.removedLines.join('\n')).digest('hex'),
          engineVersion: SIGNAL_ENGINE_VERSION,
        });
      }
    }
    
    if (newEntries.length > 0) {
      await cache.append(newEntries);
    }
    const allEntries = [...effectiveCachedEntries, ...newEntries];
    
    const patternEngine = new PatternEngine();
    const patterns = patternEngine.inferPatterns(allEntries);
    
    const adrInferenceEngine = new ADRInferenceEngine();
    const inferredPatterns = adrInferenceEngine.infer(patterns);
    
    const initEngine = new InitRecommendationEngine();
    const initSuggestion = initEngine.recommend(patterns, inferredPatterns, isArchRepo);
    process.stdout.write(` ${patterns.length} patterns, ${inferredPatterns.length} IAPs inferred\n`);

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
    this.render({ 
      truthReport, 
      plan, 
      integrityReport, 
      decisions, 
      events, 
      patterns,
      inferredPatterns,
      initSuggestion,
      verbose: opts.verbose 
    });

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
    patterns: any[];
    inferredPatterns: any[];
    initSuggestion: any;
    verbose: boolean;
  }): void {
    const { truthReport, plan, decisions, events, patterns, inferredPatterns, initSuggestion, verbose } = ctx;
    const alignScore = truthReport.alignmentScore as number;

    const scoreStr = `${alignScore >= 80 ? '\x1b[32m' : alignScore >= 60 ? '\x1b[33m' : '\x1b[31m'}${alignScore}/100\x1b[0m`;

    console.log(`  Alignment Score: ${decisions.length > 0 ? scoreStr : 'n/a (no ADRs found)'}`);
    console.log(`  Decisions:       ${decisions.length} parsed from ADRs`);
    console.log(`  Evidence:        ${events.length} events from git history`);
    console.log(`  Stable Patterns: ${patterns.filter(p => p.stability === 'stable').length} detected`);
    console.log(`  Inferred Patterns: ${inferredPatterns.length} (stable + transitional)`);
    console.log(`  Actions:         ${plan.actions.length} suggested\n`);

    // ── Semantic Inference Section ────────────────────────────────────────
    const visiblePatterns = patterns.filter(p => p.stability !== 'unstable');
    if (visiblePatterns.length > 0) {
      console.log(`  \x1b[32m✔ Observed Architectural Patterns (${visiblePatterns.length}):\x1b[0m`);
      for (const p of visiblePatterns) {
        const statusLabel = p.stability === 'stable' ? '\x1b[32m[STABLE]\x1b[0m' : 
                          p.stability === 'transitional' ? '\x1b[33m[TRANSITIONAL]\x1b[0m' : 
                          '\x1b[31m[SCHISM]\x1b[0m';
        
        console.log(`    ${statusLabel} ${p.domain.padEnd(12)} — dominant: ${p.dominantSignals[0]} (confidence: ${p.stabilityScore.toFixed(2)})`);
        if (verbose && p.trajectory?.isDirected) {
          console.log(`      → Trajectory: ${p.trajectory.direction} (velocity: ${p.trajectory.velocity.toFixed(2)})`);
        }
      }
      console.log('');
    }

    if (inferredPatterns.length > 0) {
      console.log(`  \x1b[36m~ Inferred Baseline Patterns (${inferredPatterns.length}):\x1b[0m`);
      for (const iap of inferredPatterns) {
        console.log(`    ${iap.title}`);
        if (verbose) {
          console.log(`      → Decision: ${iap.inferredDecision}`);
          console.log(`      → Confidence Factors:`);
          console.log(`        · ${iap.evidence.confidenceFactors.dominance}`);
          console.log(`        · ${iap.evidence.confidenceFactors.spread}`);
          console.log(`        · ${iap.evidence.confidenceFactors.recency}`);
          console.log(`        · ${iap.evidence.confidenceFactors.consistency}`);
          if (iap.evidence.confidenceFactors.trajectory) {
            console.log(`        · ${iap.evidence.confidenceFactors.trajectory}`);
          }
        }
      }
      console.log('');
    }

    // ── Init Recommendation ───────────────────────────────────────────────
    if (initSuggestion.recommended) {
      console.log(`  \x1b[32m★ RECOMMENDATION: Initialize ARCH\x1b[0m`);
      console.log(`    ${initSuggestion.rationale}`);
      console.log(`    \x1b[32m→ Run: arch init\x1b[0m\n`);
    } else if (initSuggestion.confidence > 0.4 && !initSuggestion.recommended && !decisions.length) {
      console.log(`  \x1b[33m~ ADOPTION SIGNAL:\x1b[0m`);
      console.log(`    ${initSuggestion.rationale}\n`);
    }

    // ── Governance Reconciliation Section ─────────────────────────────────
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
