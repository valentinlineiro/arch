import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { Command } from '../../domain/models/command.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { CausalSignalLog } from '../use-cases/causal-signal-log.js';
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

    if (sub === '--scan' || args.includes('--scan')) {
      return await this.runCodebaseScan();
    }

    if (sub === 'influence') {
      const config = await ConfigLoader.load(this.fileSystem);

      // Environment-aware model tier: CI=true → cloud tier, else local tier
      if (config && (config as any).modelTiers) {
        const isCI = process.env.CI === 'true' || process.env.CI === '1';
        const env = process.env.ARCH_ENV ?? (isCI ? 'cloud' : 'local');
        const tier = (config as any).modelTiers?.[env];
        if (tier?.analyze) {
          // Override clis to prefer the tier's analyze CLI
          const preferred = String(tier.analyze);
          const existing: any[] = (config as any).clis ?? [];
          const reordered = [
            ...existing.filter((c: any) => c.name === preferred || c.bin === preferred),
            ...existing.filter((c: any) => c.name !== preferred && c.bin !== preferred),
          ];
          if (reordered.length > 0) (config as any).clis = reordered;
        }
      }
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

        const result = spawnSync('sh', ['-c', cmd], { stdio: 'inherit' });

        try { fs.unlinkSync(tmpFile); } catch {}

        if (result.status === 0) {
          advisoryExecuted = true;
          break;
        }
        // Non-zero exit (quota exhausted, error) — try next CLI
        console.log(`  [FALLBACK] ${cli.name} exited ${result.status} — trying next CLI`);
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
    // AC4: Weak signal aggregation removed (TASK-1103) — signal-router deleted

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
      const result = await synthesizer.run();
      if (result.halted) {
        const { EscalationStore } = await import('../use-cases/escalation-store.js');
        const store = new EscalationStore(new NodeFileSystem(), '.');
        for (const cat of result.haltCategories) {
          await store.append('ANDON_HALT', cat, `Alert fatigue throttle: 5th consecutive ${cat} alert triggered system halt.`);
          fmt.log(`  ✖ ANDON_HALT escalated for "${cat}" — system halted.`);
        }
      }
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

          // Execute Advisory analysis — fallback to next CLI on non-zero exit
          const result = spawnSync('sh', ['-c', cmd], { stdio: 'inherit' });

          if (result.status !== 0) {
            console.log(`  [FALLBACK] ${cli.name} exited ${result.status} — trying next CLI`);
            continue;
          }

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


  private classifyByPath(filePath: string, config: { autonomousScope: string[]; humanGated: string[] }): string {
    const f = filePath.toLowerCase();
    // Schema / migration
    if (f.includes('migration') || f.endsWith('.sql') || f.includes('schema')) return 'schema-change';
    // Dependencies
    if (f === 'package.json' || f.includes('package-lock') || f.includes('requirements.txt') || f.includes('pyproject.toml')) return 'new-dependency';
    // Collectors
    if (f.includes('/collectors/')) return 'new-collector';
    // Routes / API
    if (f.includes('/routes/') || f.includes('index.ts') || f.includes('router')) return 'new-api-endpoint';
    // Tests
    if (f.includes('.test.') || f.includes('.spec.') || f.includes('/tests/') || f.includes('/test/')) return 'test-coverage';
    // Docs
    if (f.endsWith('.md') || f.includes('/docs/')) return 'documentation';
    // Scoring
    if (f.includes('score') || f.includes('scoring') || f.includes('rank')) return 'scoring-tuning';
    // Config
    if (f.includes('config') || f.includes('.json')) return 'protocol-fix';
    // Default: ungoverned code = bug-fix
    return 'bug-fix';
  }

  private missionDecision(missionClass: string, config: { autonomousScope: string[]; humanGated: string[] }): string {
    if (config.humanGated.includes(missionClass)) {
      return `AWAITING_HUMAN — '${missionClass}' is human-gated per arch.config.json mission block`;
    }
    return 'Pending human review.';
  }

  // ── Codebase scan ──────────────────────────────────────────────────────────

  private async runCodebaseScan(): Promise<number> {
    const pr = PathResolver.from({});
    console.log('\n  \x1b[32mARCH\x1b[0m — Codebase Scan\n');

    const ideas: Array<{ slug: string; content: string }> = [];

    // Read MISSION.md for gating
    let missionContent = '';
    try {
      missionContent = await this.fileSystem.readFile(`${this.rootPath}/docs/MISSION.md`).catch(() => '');
    } catch { /* no MISSION.md — all pending */ }

    const { join } = await import('node:path');
    // Load mission config for deterministic classification
    let missionConfig = { autonomousScope: [] as string[], humanGated: [] as string[] };
    try {
      const cfgRaw = await this.fileSystem.readFile(join(this.rootPath, 'arch.config.json')).catch(() => '{}');
      const cfg = JSON.parse(cfgRaw);
      missionConfig = {
        autonomousScope: cfg?.mission?.autonomousScope ?? [],
        humanGated: cfg?.mission?.humanGated ?? [],
      };
    } catch { /* use empty config */ }

    const [patternIdeas, ungoverned, forwardAction] = await Promise.all([
      this.detectBoilerplatePatterns(missionConfig),
      this.detectUngovernedFiles(missionConfig),
      this.mineForwardActions(missionConfig),
    ]);

    ideas.push(...patternIdeas, ...ungoverned, ...forwardAction);

    if (ideas.length === 0) {
      console.log('  No new IDEAs generated — codebase looks clean.\n');
      return 0;
    }

    // Deduplicate against existing refinement queue
    const refinementDir = `${this.rootPath}/${pr.refinement}`;
    const archiveDir = `${refinementDir}/archive`;
    let existing: string[] = [];
    try {
      const { readdir } = await import('node:fs/promises');
      const r = await readdir(refinementDir).catch(() => [] as string[]);
      const a = await readdir(archiveDir).catch(() => [] as string[]);
      existing = [...r, ...a];
    } catch { /* no refinement dir yet */ }

    let emitted = 0;
    for (const idea of ideas) {
      const fname = `IDEA-${idea.slug}.md`;
      if (existing.some(f => f === fname)) {
        console.log(`  \x1b[90mSkip\x1b[0m ${fname} — already in refinement queue`);
        continue;
      }
      const path = `${refinementDir}/${fname}`;
      await this.fileSystem.writeFile(path, idea.content);
      console.log(`  \x1b[32m+\x1b[0m ${fname}`);
      emitted++;
    }

    console.log(`\n  ${emitted} new IDEA${emitted !== 1 ? 's' : ''} emitted to ${pr.refinement}/\n`);
    return 0;
  }

  private async detectBoilerplatePatterns(missionConfig = { autonomousScope: [] as string[], humanGated: [] as string[] }): Promise<Array<{ slug: string; content: string }>> {
    const ideas: Array<{ slug: string; content: string }> = [];
    try {
      const { readdir, readFile } = await import('node:fs/promises');
      const { join } = await import('node:path');

      // Scan source directories for repeated function signature patterns
      const srcDirs = ['src', 'cli/src', 'lib'].map(d => join(this.rootPath, d));
      const tsFiles: string[] = [];

      const collect = async (dir: string): Promise<void> => {
        let entries: string[] = [];
        try { entries = await readdir(dir); } catch { return; }
        for (const e of entries) {
          const full = join(dir, e);
          if (e.endsWith('.ts') && !e.includes('.test.') && !e.includes('.spec.')) tsFiles.push(full);
          else if (!e.includes('.') && !e.startsWith('.')) await collect(full);
        }
      };
      for (const d of srcDirs) await collect(d);

      // Extract export function signatures
      const sigMap = new Map<string, string[]>(); // normalized-sig → [file, ...]
      for (const f of tsFiles.slice(0, 200)) {
        const content = await readFile(f, 'utf8').catch(() => '');
        const sigs = [...content.matchAll(/^export (?:async )?function (\w+)\(([^)]{0,80})\)/gm)];
        for (const m of sigs) {
          // Normalize: replace identifiers with types only
          const normalized = m[2].replace(/\w+:\s*/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
          if (!normalized) continue;
          const key = normalized;
          const files = sigMap.get(key) ?? [];
          files.push(f.replace(this.rootPath + '/', ''));
          sigMap.set(key, files);
        }
      }

      // Patterns with 3+ files sharing the same signature shape
      for (const [sig, files] of sigMap.entries()) {
        if (files.length < 3) continue;
        const slug = `scan-boilerplate-${sig.replace(/[^a-z0-9]/gi, '-').slice(0, 30).toLowerCase()}`;
        const fileList = files.slice(0, 6).map(f => `- ${f}`).join('\n');
        const mClass = files[0].includes('/collectors/') ? 'new-collector' : 'simplification';
        const mDecision = this.missionDecision(mClass, missionConfig);
        ideas.push({
          slug,
          content: `# IDEA: Extract shared abstraction — ${files.length} files share identical signature pattern

**Status:** DRAFT
**Created:** ${new Date().toISOString().slice(0, 10)}
**Source:** codebase-scan (boilerplate-pattern)
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Evidence

${files.length} files share the signature shape: \`(${sig})\`

${fileList}${files.length > 6 ? `\n- ...and ${files.length - 6} more` : ''}

## Problem

Repeated identical function signatures across multiple files suggest a missing abstraction — an interface, base class, or factory that would make adding new implementations a matter of configuration rather than copy-paste.

## Proposed solution

Define a shared interface or registry for this pattern. New implementations satisfy the interface rather than duplicating the signature manually.
`,
        });
      }
    } catch { /* non-blocking */ }
    return ideas;
  }

  private async detectUngovernedFiles(missionConfig = { autonomousScope: [] as string[], humanGated: [] as string[] }): Promise<Array<{ slug: string; content: string }>> {
    const ideas: Array<{ slug: string; content: string }> = [];
    try {
      const { execSync } = await import('node:child_process');

      // Get files with 3+ commits, none of which contain a TASK-ID
      const logOutput = execSync(
        `git log --format="%H %s" --no-merges | head -200`,
        { cwd: this.rootPath, encoding: 'utf8', timeout: 10000, stdio: ['pipe','pipe','pipe'] }
      ).trim().split('\n');

      const taskPattern = /\[TASK-\d+\]/;
      const ungovernedHashes = logOutput
        .filter(line => !taskPattern.test(line))
        .map(line => line.split(' ')[0]);

      if (ungovernedHashes.length === 0) return ideas;

      // Get files touched by ungoverned commits
      const fileCommitCount = new Map<string, number>();
      for (const hash of ungovernedHashes.slice(0, 50)) {
        const files = execSync(
          `git diff-tree --no-commit-id -r --name-only ${hash} 2>/dev/null`,
          { cwd: this.rootPath, encoding: 'utf8', timeout: 5000, stdio: ['pipe','pipe','pipe'] }
        ).trim().split('\n').filter(Boolean);
        for (const f of files) {
          if (f.startsWith('docs/') || f.startsWith('.arch/') || f.startsWith('.git')) continue;
          if (['README.md','CHANGELOG.md','package-lock.json','package.json','ARCH.md'].includes(f)) continue;
          fileCommitCount.set(f, (fileCommitCount.get(f) ?? 0) + 1);
        }
      }

      // Files touched 3+ times in ungoverned commits
      for (const [file, count] of fileCommitCount.entries()) {
        if (count < 3) continue;
        const slug = `scan-ungoverned-${file.replace(/[^a-z0-9]/gi, '-').slice(0, 40).toLowerCase()}`;
        const uClass = this.classifyByPath(file, missionConfig);
        const uDecision = this.missionDecision(uClass, missionConfig);
        ideas.push({
          slug,
          content: `# IDEA: Retroactive task capture — ${file} modified ${count} times without governance

**Status:** DRAFT
**Created:** ${new Date().toISOString().slice(0, 10)}
**Source:** codebase-scan (ungoverned-file)
**Candidate-size:** XS
**Depends:** none
**Mission-class:** ${uClass}
**Decision:** ${uDecision}

## Evidence

\`${file}\` was modified **${count} times** in commits with no [TASK-ID] reference.

These changes have no governance record — no task, no Hansei, no decision trail.

## Problem

High-frequency ungoverned changes to a file mean the work being done on it is invisible to the governance corpus. If something breaks or needs revisiting, there is no trail to follow.

## Proposed solution

Capture a retroactive task describing the accumulated changes to \`${file}\`. Write a brief Hansei covering what changed and why. This creates a corpus entry without requiring a rewrite of history.
`,
        });
      }
    } catch { /* git not available or no history */ }
    return ideas;
  }

  private async mineForwardActions(missionConfig = { autonomousScope: [] as string[], humanGated: [] as string[] }): Promise<Array<{ slug: string; content: string }>> {
    const ideas: Array<{ slug: string; content: string }> = [];
    try {
      const { readdir, readFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const pr = PathResolver.from({});
      const archiveDir = join(this.rootPath, pr.archive);

      const files = await readdir(archiveDir).catch(() => [] as string[]);
      const taskFiles = files.filter(f => f.startsWith('TASK-') && f.endsWith('.md'));

      for (const fname of taskFiles.slice(-100)) { // last 100 archived tasks
        const content = await readFile(join(archiveDir, fname), 'utf8').catch(() => '');
        const forwardMatch = content.match(/\*\*Forward Action:\*\*\s*(.+?)(?:\n|$)/);
        if (!forwardMatch) continue;

        const action = forwardMatch[1].trim();
        const isPlaceholder = /^none\.?$/i.test(action) || /^none required\.?$/i.test(action);
        if (isPlaceholder || action.length < 40) continue;
        if (/TASK-\d+/.test(action)) continue; // already references a task
        if (ideas.length >= 10) break; // cap at 10 per scan

        const taskId = fname.replace('.md', '');
        const slug = `scan-forward-action-${taskId.toLowerCase()}`;

        const fDecision = this.missionDecision('documentation', missionConfig);
        ideas.push({
          slug,
          content: `# IDEA: Unresolved forward action from ${taskId}

**Status:** DRAFT
**Created:** ${new Date().toISOString().slice(0, 10)}
**Source:** codebase-scan (forward-action-mining)
**Candidate-size:** XS
**Depends:** none
**Mission-class:** documentation
**Decision:** ${fDecision}

## Evidence

**${taskId}** closed with Forward Action:

> ${action}

This forward action was never promoted to an IDEA or task.

## Problem

Forward Actions that are never actioned accumulate as silent technical debt — the insight was captured but not converted into governed work.

## Proposed solution

Review this forward action and either: promote to a task if still relevant, or archive this IDEA with a note explaining why it was superseded.
`,
        });
      }
    } catch { /* non-blocking */ }
    return ideas;
  }
}
