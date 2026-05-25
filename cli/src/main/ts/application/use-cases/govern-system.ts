import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { Task, TaskStatus, FocusLevel } from '../../domain/models/task.js';
import { BatchSystem } from './batch-system.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { CausalSignalLog } from './causal-signal-log.js';
import { ReflectInfluenceReport, DEFAULT_THRESHOLDS } from './reflect-influence-report.js';
import { TaskValidator } from '../../domain/services/task-validator.js';
import { CorpusAuditCommand } from '../commands/corpus-audit-command.js';
import { StatusReportService } from '../../domain/services/status-report-service.js';
import { GovernTransaction } from './govern-transaction.js';
import { PathResolver } from '../../domain/services/path-resolver.js';
import {
  FocusRuling, LedgerState,
  parseLedger, committedRulings, serializeLedger,
} from './focus-ledger.js';
import { computeTrustedMetrics } from './compute-trusted-metrics.js';
import { LightweightMetricsRefresh } from './lightweight-metrics-refresh.js';
import { readDeepAnalysisState, isDeepAnalysisDue } from './deep-analysis-state.js';
import { hasOverdueWeakSignal } from './weak-signal-checker.js';
import { DeterministicACVerifier } from '../../domain/services/deterministic-ac-verifier.js';

export interface GovernResult {
  analysisNeeded: boolean;
  reasons: string[];
  projectComplete?: boolean;
}

export class GovernSystem {
  private batchSystem: BatchSystem;
  private readonly pathResolver: PathResolver;

  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem,
    private causalSignalLog?: CausalSignalLog,
    private rootPath: string = '.',
    pathResolver?: PathResolver
  ) {
    this.batchSystem = new BatchSystem(fileSystem);
    this.pathResolver = pathResolver ?? PathResolver.from({});
  }

  async execute(noConduct = false): Promise<GovernResult> {
    const config = await ConfigLoader.load(this.fileSystem);
    const conductEveryN = config.governance?.conductEveryN ?? 3;
    const analysisReasons: string[] = [];

    // 0. Batch Drain
    await this.batchSystem.drain();

    // 0.1 Archival Guard — Auto-archive DONE/REJECTED tasks from tasksDir
    let archivedThisTick = 0;
    try {
      archivedThisTick = await this.archiveDoneTasks();
    } catch (error: any) {
      throw error; // Halt execution on archival escalation
    }

    // 0.2 Sprint lifecycle — close sprint when N tasks archived, open next
    if (archivedThisTick > 0) {
      await this.checkSprintLifecycle(config, archivedThisTick);
    }

    // 0.3 Sprint state sync — ensure state file matches arch.config.json intent
    if (config.currentSprint) {
      const { SprintService } = await import('../../domain/services/sprint-service.js');
      await SprintService.initFromConfig(this.fileSystem, config.currentSprint);
    }

    // 1. Rule 2 — Replenishment check
    const readyTasks = await this.taskRepository.findReady();
    if (readyTasks.length < 3) {
      console.log(`  READY tasks < 3 — analysis needed (run arch reflect to surface Kaizen).`);
      analysisReasons.push('replenishment');
    }

    // 2. Rule 3 — Conduct cadence check
    const execCount = await this.getExecCountSinceLastThink();
    if (execCount >= conductEveryN) {
      console.log(`  Exec count (${execCount}) >= N (${conductEveryN}) — analysis due (run arch reflect).`);
      analysisReasons.push('cadence');
    }

    // 2.5. Deep analysis cadence check
    const deepCadenceN = config.reflect?.deepCadenceN ?? 5;
    const deepState = await readDeepAnalysisState(this.fileSystem);
    const currentTick = await this.getCurrentTick();
    const deepDue = isDeepAnalysisDue(deepState, currentTick, deepCadenceN);

    let weakSignalOverdue = false;
    const weakSignalsPath = 'docs/tensions/weak-signals.md';
    if (await this.fileSystem.exists(weakSignalsPath)) {
      const content = await this.fileSystem.readFile(weakSignalsPath);
      const warnings: string[] = [];
      weakSignalOverdue = hasOverdueWeakSignal(content, new Date(), warnings);
      warnings.forEach(w => console.log(`  ${w}`));
    }

    if (deepDue || weakSignalOverdue) {
      const reason = weakSignalOverdue
        ? 'weak signal past adjudication deadline'
        : `${currentTick - (deepState?.lastDeepRunTick ?? 0)} ticks since last deep run`;
      console.log(`  Deep analysis due (${reason}) — run arch reflect --deep`);
      analysisReasons.push('deep-analysis-due');
    }

    // 3. Focus Sovereignty — run the AGFM tick cycle
    await this.decideFocus(config);

    await this.checkReflectThresholds(config);

    // 4. Materialized Reporting Layer (TASK-971)
    // Triggers after deterministic tick completion. Non-authoritative projection.
    try {
      const statusService = new StatusReportService(this.taskRepository, this.rootPath);
      const report = await statusService.generateReport();
      const markdown = statusService.generateMarkdown(report);
      
      console.log('\n  ARCH — Materialized Reporting Layer');
      console.log('  \x1b[33m⚠ Warning: Materialized report is strictly non-authoritative.\x1b[0m');
      
      await statusService.publish('README.md', markdown);
      await statusService.publish('docs/ROADMAP.md', markdown);
    } catch (err) {
      if (process.env.ARCH_DEBUG) console.error('[TASK-971] status refresh failed:', err);
    }

    // Lightweight metrics refresh — non-fatal
    try {
      const metrics = await computeTrustedMetrics(this.fileSystem);
      await new LightweightMetricsRefresh(this.fileSystem).execute(metrics);
    } catch (err) {
      // non-fatal — metrics refresh failure does not affect task operations
      if (process.env.ARCH_DEBUG) console.error('[TASK-257] metrics refresh failed:', err);
    }

    // Corpus quality audit — runs every N ticks, tiered response
    const auditEveryN: number = (config.governance as any)?.corpusAuditEveryN ?? 10;
    const warnThreshold: number = (config.governance as any)?.corpusAuditThresholdWarn ?? 80;
    const haltThreshold: number = (config.governance as any)?.corpusAuditThresholdHalt ?? 60;
    if (currentTick % auditEveryN === 0) {
      try {
        const auditor = new CorpusAuditCommand(this.fileSystem, this.gitRepository);
        const score = await auditor.runQuiet();
        if (score < haltThreshold) {
          const msg = `Corpus quality score ${score}/100 is below halt threshold (${haltThreshold}). Governance suggestions are unreliable. Run arch corpus audit --verbose.`;
          await this.appendInbox('CORPUS', 'ANDON_HALT', msg);
          console.log(`  \x1b[31m✖ CORPUS HALT: score ${score}/100 < ${haltThreshold}. See ${this.pathResolver.inbox}.\x1b[0m`);
        } else if (score < warnThreshold) {
          const msg = `Corpus quality score ${score}/100 is below warn threshold (${warnThreshold}). Governance suggestions shown with reduced confidence. Run arch corpus audit --verbose.`;
          await this.appendInbox('CORPUS', 'CORPUS_ALERT', msg);
          console.log(`  \x1b[33m⚠ CORPUS ALERT: score ${score}/100 < ${warnThreshold}. See ${this.pathResolver.inbox}.\x1b[0m`);
        } else {
          console.log(`  \x1b[32m✔\x1b[0m Corpus quality: ${score}/100`);
        }
      } catch (err) {
        if (process.env.ARCH_DEBUG) console.error('[corpus-audit] audit failed:', err);
        // non-fatal — audit failure does not block governance
      }
    }

    // 5. Project DoD gate
    const projectComplete = await this.checkProjectDoD();

    // 6. Commit materialized output files produced this tick.
    // These are non-authoritative projections written by the reporting and metrics layers;
    // they have no pre-commit hook requirements, so a best-effort trailing commit is safe.
    try {
      const reportFiles = [
        'README.md',
        'docs/ROADMAP.md',
        'docs/METRICS.md',
        this.pathResolver.statusProjection,
        this.pathResolver.corpusIndex,
        'docs/SENTINEL-LOG.md',
        `${this.pathResolver.archDir}/reflect-breach-log.jsonl`,
      ];
      for (const f of reportFiles) {
        try { await this.gitRepository.add(f); } catch { /* file may not exist */ }
      }
      await this.gitRepository.commit('chore: [THINK] govern materialized reporting');
    } catch (err: any) {
      if (!err.message?.includes('nothing to commit')) {
        if (process.env.ARCH_DEBUG) console.error('[govern] materialized commit failed:', err);
      }
    }

    return { analysisNeeded: analysisReasons.length > 0, reasons: analysisReasons, projectComplete };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ARCH NOTE (latent boundary — not implemented)
  //
  // If system complexity ever requires separation of the pure decision core,
  // the natural decomposition is:
  //
  //   1. evaluateState(world, ledger)    → DecisionContext
  //   2. resolveFocus(context, config)   → Ruling[]
  //   3. applyRulings(world, ledger, rulings) → { world, ledger }
  //
  // Current implementation intentionally keeps these embedded in a single
  // deterministic orchestrator to minimize surface area and operational
  // complexity. No refactor required unless testing or simulation demands
  // isolated decision execution.
  // ─────────────────────────────────────────────────────────────────────────

  private async checkProjectDoD(): Promise<boolean | undefined> {
    const projectPath = 'docs/PROJECT.md';
    if (!await this.fileSystem.exists(projectPath)) return undefined;

    const content = await this.fileSystem.readFile(projectPath);
    const dodStart = content.indexOf('\n## Definition of Done');
    if (dodStart === -1) return undefined;

    const bodyStart = content.indexOf('\n', dodStart + 1) + 1;
    const nextSection = content.indexOf('\n## ', bodyStart);
    const dodSection = nextSection === -1 ? content.slice(bodyStart) : content.slice(bodyStart, nextSection);

    const verifier = new DeterministicACVerifier(this.rootPath);
    const result = await verifier.verifySection(dodSection);

    if (!result.pass) return false;

    // Check if already emitted to avoid duplicates
    const ledgerPath = this.pathResolver.focusLedger;
    let ledgerContent = '';
    if (await this.fileSystem.exists(ledgerPath)) {
      ledgerContent = await this.fileSystem.readFile(ledgerPath);
    }
    if (ledgerContent.includes('PROJECT_COMPLETE')) return true;

    // Append ruling
    const ruling = JSON.stringify({
      action: 'PROJECT_COMPLETE',
      taskId: 'PROJECT',
      tick: await this.getCurrentTick(),
      timestamp: new Date().toISOString(),
    });
    await this.fileSystem.appendFile(ledgerPath, ruling + '\n');

    // Write RETRO.md
    const retroLine = `\n## PROJECT_COMPLETE — ${new Date().toISOString().slice(0, 10)}\nAll Definition of Done predicates in docs/PROJECT.md passed. Project is complete.\n`;
    const retroPath = 'docs/RETRO.md';
    const existing = await this.fileSystem.exists(retroPath)
      ? await this.fileSystem.readFile(retroPath)
      : '';
    await this.fileSystem.writeFile(retroPath, existing + retroLine);

    console.log('  \x1b[32m✔\x1b[0m PROJECT_COMPLETE — all DoD predicates pass. Loop will exit.');
    return true;
  }

  private priorityNum(p: string): number {
    return parseInt(p.replace('P', ''), 10);
  }

  private isEligible(task: Task, doneTaskIds: Set<string>): boolean {
    if (task.status !== TaskStatus.READY) return false;
    if (task.focus !== FocusLevel.NONE) return false;
    const deps = (task.depends ?? []).filter(d => d.toLowerCase() !== 'none');
    return deps.every(dep => doneTaskIds.has(dep));
  }

  private isEligibleAfterFix(task: Task, doneTaskIds: Set<string>, fixedIds: Set<string>): boolean {
    if (task.status !== TaskStatus.READY) return false;
    if (task.focus !== FocusLevel.NONE && !fixedIds.has(task.id)) return false;
    const deps = (task.depends ?? []).filter(d => d.toLowerCase() !== 'none');
    return deps.every(dep => doneTaskIds.has(dep));
  }

  private isFocusRetainable(task: Task, doneTaskIds: Set<string>): boolean {
    if (task.status !== TaskStatus.READY && task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.REVIEW) return false;
    const deps = (task.depends ?? []).filter(d => d.toLowerCase() !== 'none');
    return deps.every(dep => doneTaskIds.has(dep));
  }

  private get ledgerPath(): string {
    return this.rootPath && this.rootPath !== '.' ? `${this.rootPath}/${this.pathResolver.focusLedger}` : this.pathResolver.focusLedger;
  }

  private async loadLedger(): Promise<LedgerState> {
    try {
      const content = await this.fileSystem.readFile(this.ledgerPath);
      return parseLedger(content);
    } catch {
      return { lastCommittedTick: 0, rulings: [] };
    }
  }

  private async updateFocusFlag(task: Task, focusYes: boolean): Promise<boolean> {
    if (!task.rawMetaLine) return false;
    const filePath = task.filePath;
    const original = await this.fileSystem.readFile(filePath);
    const from = focusYes ? 'Focus:no' : 'Focus:yes';
    const to = focusYes ? 'Focus:yes' : 'Focus:no';
    if (!task.rawMetaLine.includes(from)) return false;
    const updated = original.replace(task.rawMetaLine, task.rawMetaLine.replace(from, to));
    if (updated === original) return false;
    await this.fileSystem.writeFile(filePath, updated);
    return true;
  }

  private async writeLedgerTick(
    ledger: LedgerState,
    newRulings: FocusRuling[],
    nextTick: number,
    changedTaskFiles: string[]
  ): Promise<void> {
    const ledgerPath = this.ledgerPath;
    const allRulings = [...committedRulings(ledger), ...newRulings];
    const content = serializeLedger(allRulings, nextTick);

    // Use GovernTransaction to buffer arch-dir writes and flush atomically before commit
    const tx = new GovernTransaction(this.fileSystem);
    await tx.writeFile(ledgerPath, content);

    // Flush all buffered arch-dir writes atomically before committing
    await tx.flush();

    // Stage ledger + any task meta files whose Focus flag was flipped this tick.
    try { await this.gitRepository.add(ledgerPath); } catch { /* ok */ }
    for (const f of changedTaskFiles) {
      try { await this.gitRepository.add(f); } catch { /* ok */ }
    }

    if (newRulings.length > 0) {
      const primary = newRulings[newRulings.length - 1];
      const msg = `chore: [${primary.taskId}] govern tick ${nextTick}: ${primary.action}`;
      try {
        await this.gitRepository.commit(msg);
        console.log(`  Committed: ${msg}`);
      } catch (err: any) {
        if (!err.message?.includes('nothing to commit')) throw err;
      }
    }
  }

  private async checkSprintLifecycle(config: any, archivedThisTick: number): Promise<void> {
    const closeAfterN: number = config.sprintCloseAfterN ?? 15;
    const currentSprintName: string = config.currentSprint ?? '';
    if (!currentSprintName) return;

    const { SprintService } = await import('../../domain/services/sprint-service.js');
    const svc = new SprintService(this.fileSystem);

    // Seed from config if no state file exists
    let sprint = await svc.getCurrent();
    if (!sprint || sprint.name !== currentSprintName) {
      sprint = await SprintService.initFromConfig(this.fileSystem, currentSprintName);
    }

    if (sprint.status !== 'ACTIVE') return;

    // Count tasks archived since sprint opened
    const archivedFiles = await this.fileSystem.readDirectory(this.pathResolver.archive).catch(() => [] as string[]);
    const sprintOpenTs = new Date(sprint.startedAt).getTime();
    let countSinceOpen = 0;
    for (const f of archivedFiles.filter(x => x.startsWith('TASK-') && x.endsWith('.md'))) {
      try {
        const content = await this.fileSystem.readFile(`${this.pathResolver.archive}/${f}`);
        const closedAt = content.match(/\*\*Closed-at:\*\*\s*(\S+)/)?.[1];
        if (closedAt && new Date(closedAt).getTime() >= sprintOpenTs) countSinceOpen++;
      } catch { /* skip */ }
    }

    if (countSinceOpen < closeAfterN) return;

    // Close current sprint
    const velocity = countSinceOpen;
    const closed = await svc.closeCurrent(velocity);
    console.log(`\n  \x1b[32m⚡ Sprint closed:\x1b[0m ${closed.name} | velocity: ${velocity} tasks\n`);

    // Write deterministic retro entry
    await this.writeRetroEntry(closed, velocity);

    // Derive next sprint name from version
    const nextName = await this.deriveNextSprintName(config);
    await svc.openNext(nextName);

    // Update arch.config.json
    const cfgRaw = await this.fileSystem.readFile('arch.config.json');
    const cfgObj = JSON.parse(cfgRaw);
    cfgObj.currentSprint = nextName;
    await this.fileSystem.writeFile('arch.config.json', JSON.stringify(cfgObj, null, 2));

    console.log(`  \x1b[32m⚡ Sprint opened:\x1b[0m ${nextName}\n`);
  }

  private async writeRetroEntry(sprint: any, velocity: number): Promise<void> {
    const retroPath = 'docs/RETRO.md';
    let existing = '';
    try { existing = await this.fileSystem.readFile(retroPath); } catch {}
    if (!existing) existing = '# Sprint Retrospectives\n\n';

    const now = new Date().toISOString().slice(0, 10);
    const entry = `## ${sprint.name}\n**Opened:** ${sprint.startedAt?.slice(0, 10) ?? '?'}  **Closed:** ${now}\n**Velocity:** ${velocity} tasks\n**SPRINT_CLOSE:** appended to ${this.pathResolver.focusLedger}\n\n`;

    // Append after the header
    const headerEnd = existing.indexOf('\n\n');
    const insertAt = headerEnd >= 0 ? headerEnd + 2 : existing.length;
    const updated = existing.slice(0, insertAt) + entry + existing.slice(insertAt);
    await this.fileSystem.writeFile(retroPath, updated);
  }

  private async deriveNextSprintName(config: any): Promise<string> {
    const prefix = config.sprintAutoNamePrefix ?? 'sprint/v';
    // Read version from package.json or cli/package.json
    try {
      const pkgRaw = await this.fileSystem.readFile('cli/package.json');
      const pkg = JSON.parse(pkgRaw);
      const ver = pkg.version ?? '1.0.0';
      const ts = new Date().toISOString().slice(0, 7); // YYYY-MM
      return `${prefix}${ver}-${ts}`;
    } catch {
      const ts = new Date().toISOString().slice(0, 10);
      return `${prefix}next-${ts}`;
    }
  }

  private async decideFocus(config: any): Promise<void> {
    const allTasks = await this.taskRepository.getAll();
    const doneTaskIds = new Set(allTasks.filter(t => t.status === TaskStatus.DONE).map(t => t.id));
    const activeTasks = await this.taskRepository.getActive();

    const ledger = await this.loadLedger();
    const committed = committedRulings(ledger);
    const nextTick = ledger.lastCommittedTick + 1;
    const minTicks: number = config?.minTicksBeforeSwitch ?? 2;

    const acquiredRulings = committed.filter(r => r.action === 'FOCUS_ACQUIRED');
    const lastAcquired = acquiredRulings[acquiredRulings.length - 1] ?? null;
    const ledgerFocusedId = lastAcquired?.taskId ?? null;
    const ledgerFocused = ledgerFocusedId
      ? (activeTasks.find(t => t.id === ledgerFocusedId) ?? null)
      : null;

    const newRulings: FocusRuling[] = [];
    const changedFiles: string[] = [];

    // Rule 1: Integrity fix — Focus:yes in world state with no FOCUS_ACQUIRED in committed ledger
    const integrityFixedIds = new Set<string>();
    for (const t of allTasks.filter(t => t.focus !== FocusLevel.NONE)) {
      const hasAcquisition = committed.some(r => r.action === 'FOCUS_ACQUIRED' && r.taskId === t.id);
      if (!hasAcquisition) {
        integrityFixedIds.add(t.id);
        newRulings.push({ tick: nextTick, taskId: t.id, action: 'INTEGRITY_FIX', timestamp: new Date().toISOString() });
        const changed = await this.updateFocusFlag(t, false);
        if (changed) changedFiles.push(t.filePath);
        console.log(`  INTEGRITY_FIX: ${t.id} held Focus:yes with no acquisition ruling`);
      }
    }

    // Eligible candidates: treat integrity-fixed tasks as focus=false (their in-memory flag is stale)
    const eligible = activeTasks
      .filter(t => this.isEligibleAfterFix(t, doneTaskIds, integrityFixedIds))
      .sort((a, b) => this.priorityNum(a.priority) - this.priorityNum(b.priority));

    const focused = ledgerFocused;

    // Rule 2: No current focus — assign top eligible
    if (!focused) {
      if (eligible.length > 0) {
        const top = eligible[0];
        newRulings.push({ tick: nextTick, taskId: top.id, action: 'FOCUS_ACQUIRED', timestamp: new Date().toISOString() });
        const changed = await this.updateFocusFlag(top, true);
        if (changed) changedFiles.push(top.filePath);
        console.log(`  FOCUS_ACQUIRED: ${top.id} (no previous focus)`);
      } else {
        console.log('  No eligible tasks. No focus assigned.');
      }
      await this.writeLedgerTick(ledger, newRulings, nextTick, changedFiles);
      return;
    }

    // Rule 3: Focused task lost eligibility
    if (!this.isFocusRetainable(focused, doneTaskIds)) {
      const cleared = await this.updateFocusFlag(focused, false);
      if (cleared) changedFiles.push(focused.filePath);
      if (eligible.length > 0) {
        const top = eligible[0];
        newRulings.push({ tick: nextTick, taskId: top.id, action: 'FOCUS_ACQUIRED', previousTask: focused.id, timestamp: new Date().toISOString() });
        const changed = await this.updateFocusFlag(top, true);
        if (changed) changedFiles.push(top.filePath);
        console.log(`  FOCUS_ACQUIRED: ${top.id} (${focused.id} lost eligibility)`);
      } else {
        newRulings.push({ tick: nextTick, taskId: focused.id, action: 'FOCUS_RELEASED', timestamp: new Date().toISOString() });
        console.log(`  FOCUS_RELEASED: ${focused.id} (lost eligibility, no candidates)`);
      }
      await this.writeLedgerTick(ledger, newRulings, nextTick, changedFiles);
      return;
    }

    // Rule 4: Minimum inercia window
    const ticksSinceAcquired = nextTick - (lastAcquired?.tick ?? 0);
    if (ticksSinceAcquired < minTicks) {
      newRulings.push({ tick: nextTick, taskId: focused.id, action: 'FOCUS_PRESERVED', timestamp: new Date().toISOString() });
      console.log(`  FOCUS_PRESERVED: ${focused.id} (inercia window: ${ticksSinceAcquired}/${minTicks} ticks)`);
      await this.writeLedgerTick(ledger, newRulings, nextTick, changedFiles);
      return;
    }

    // Rule 5: Priority preemption
    const focusedPriority = this.priorityNum(focused.priority);
    const preemptor = eligible.find(c => this.priorityNum(c.priority) < focusedPriority);
    if (preemptor) {
      const clearedOld = await this.updateFocusFlag(focused, false);
      if (clearedOld) changedFiles.push(focused.filePath);
      const changedNew = await this.updateFocusFlag(preemptor, true);
      if (changedNew) changedFiles.push(preemptor.filePath);
      newRulings.push({ tick: nextTick, taskId: preemptor.id, action: 'FOCUS_ACQUIRED', previousTask: focused.id, timestamp: new Date().toISOString() });
      console.log(`  FOCUS_ACQUIRED: ${preemptor.id} preempts ${focused.id} (P${this.priorityNum(preemptor.priority)} > P${focusedPriority})`);
      await this.writeLedgerTick(ledger, newRulings, nextTick, changedFiles);
      return;
    }

    // Rule 6: Preserve
    newRulings.push({ tick: nextTick, taskId: focused.id, action: 'FOCUS_PRESERVED', timestamp: new Date().toISOString() });
    console.log(`  FOCUS_PRESERVED: ${focused.id}`);
    await this.writeLedgerTick(ledger, newRulings, nextTick, changedFiles);
  }

  private async checkReflectThresholds(config: any): Promise<void> {
    try {
      const thresholds = { ...DEFAULT_THRESHOLDS, ...(config.reflect?.thresholds ?? {}) };
      const reporter = new ReflectInfluenceReport(this.fileSystem, this.rootPath);
      const report = await reporter.compute(thresholds);

      const breachLogPath = `${this.rootPath}/${this.pathResolver.archDir}/reflect-breach-log.jsonl`;
      const now = new Date().toISOString();

      let history: Array<{ timestamp: string; rule: string; breached: boolean }> = [];
      try {
        const raw = await this.fileSystem.readFile(breachLogPath);
        history = raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
      } catch { /* no history yet */ }

      const breachedRules = new Set(report.violations.map(v => v.rule));
      const allRules: Array<'engagement' | 'observability_gap'> = ['engagement', 'observability_gap'];

      for (const rule of allRules) {
        const isBreached = breachedRules.has(rule);
        const ruleHistory = history.filter(h => h.rule === rule);
        const wasBreachedLastTick = ruleHistory.length > 0 && ruleHistory[ruleHistory.length - 1].breached;
        const consecutiveBreaches = [...ruleHistory].reverse().findIndex(h => !h.breached);
        const consecutiveCount = consecutiveBreaches === -1 ? ruleHistory.length : consecutiveBreaches;

        await this.fileSystem.appendFile(
          breachLogPath,
          JSON.stringify({ timestamp: now, rule, breached: isBreached }) + '\n'
        );

        const violation = report.violations.find(v => v.rule === rule);
        if (isBreached) {
          const newConsecutive = consecutiveCount + 1;
          if (!wasBreachedLastTick) {
            await this.appendInbox('REFLECT', 'INFLUENCE_THRESHOLD_VIOLATION', violation!.message);
            console.log(`  ⚠ REFLECT threshold breach: ${violation!.message}`);
          } else if (newConsecutive >= thresholds.persistenceN) {
            const msg = `Persistent breach (${newConsecutive} consecutive cycles): ${violation!.message}`;
            await this.appendInbox('REFLECT', 'INFLUENCE_BREACH_PERSISTENT', msg);
            console.log(`  ✖ REFLECT persistent breach: ${msg}`);
          } else {
            console.log(`  ⚠ REFLECT breach continues (${newConsecutive}/${thresholds.persistenceN}): ${violation!.message}`);
          }
        } else if (wasBreachedLastTick) {
          const msg = `${rule} threshold breach cleared. Verify: did health improve (more decisions attributed) — or did operators adapt behavior to the threshold (worked around the measurement)? These are opposite outcomes that look identical in the data.`;
          await this.appendInbox('REFLECT', 'INFLUENCE_BREACH_CLEARED', msg);
          console.log(`  ✔ REFLECT breach cleared: ${rule}`);
        }
      }
    } catch {
      // Reflect threshold check must never block governance
    }
  }

  private async getCurrentTick(): Promise<number> {
    try {
      const ledger = await this.loadLedger();
      return ledger.lastCommittedTick;
    } catch {
      return 0;
    }
  }

  private async getExecCountSinceLastThink(): Promise<number> {
    const log = await this.gitRepository.getLog(100);
    let count = 0;
    for (const msg of log) {
      if (msg.includes('[THINK]')) break;
      if (/\[TASK-\d+\]/.test(msg)) count++;
    }
    return count;
  }

  private async archiveDoneTasks(): Promise<number> {
    const activeTasks = await this.taskRepository.getActive();
    const toArchive = activeTasks.filter(t => t.status === TaskStatus.DONE || t.status === TaskStatus.REJECTED);

    for (const task of toArchive) {
      await this.archiveFile(task.id);
    }

    const statusLines = await this.gitRepository.getStatusLines();
    const phantomIds = new Set<string>();

    for (const line of statusLines) {
      const match = line.match(/(D docs\/tasks\/|\?\? docs\/archive\/)(TASK-\d+)\\.md/);
      if (match) {
        phantomIds.add(match[2]);
      }
    }

    for (const id of phantomIds) {
      console.log(`  Syncing phantom archive ${id}...`);
      await this.archiveFile(id);
    }

    // Invalidate corpus index when archive changes so next audit rebuilds
    if (toArchive.length > 0 || phantomIds.size > 0) {
      const { CorpusIndexService } = await import('./corpus-index.js');
      await new CorpusIndexService(this.fileSystem, this.gitRepository).invalidate();
    }

    return toArchive.length + phantomIds.size;
  }

  private async archiveFile(taskId: string): Promise<void> {
    const sourcePath = `${this.pathResolver.tasks}/${taskId}.md`;
    const targetPath = `${this.pathResolver.archive}/${taskId}.md`;

    try {
      const archiveContent = await this.getArchiveCandidateContent(sourcePath, targetPath);
      if (archiveContent) {
        const metaViolation = this.validateMetaLineFormat(taskId, archiveContent);
        if (metaViolation) {
          throw new Error(metaViolation);
        }
        const hanseiViolation = await this.validateHanseiRequirement(taskId, archiveContent);
        if (hanseiViolation) {
          throw new Error(hanseiViolation);
        }
      }

      if (await this.fileSystem.exists(sourcePath)) {
        console.log(`  Auto-archiving ${taskId}...`);
        await this.gitRepository.mv(sourcePath, targetPath);
        // Re-stage the destination to capture any working-tree edits (e.g. Closed-at, Approval)
        // made to the file before govern ran — git mv stages the rename from the index, not
        // the working tree, so local modifications are left unstaged without this add.
        try { await this.gitRepository.add(targetPath); } catch { /* ok */ }
      } else if (await this.fileSystem.exists(targetPath)) {
        await this.gitRepository.add(targetPath);
        const status = await this.gitRepository.getStatusLines();
        if (status.some(l => l.includes(`D ${this.pathResolver.tasks}/${taskId}.md`))) {
          await this.gitRepository.rm(sourcePath);
        }
      } else {
        return;
      }

      await this.gitRepository.commit(`chore: archive [${taskId}] DONE [${taskId}] [THINK]`);
      console.log(`  ✓ ${taskId} archived and committed.`);
    } catch (error: any) {
      console.error(`  ✖ Failed to archive ${taskId}: ${error.message}`);
      await this.appendInbox(taskId, 'ANDON_HALT', error.message);
      await this.emitGovernViolationSignal(taskId, error.message);
      throw error;
    }
  }

  private async emitGovernViolationSignal(taskId: string, violation: string): Promise<void> {
    if (!this.causalSignalLog) return;
    await this.causalSignalLog.append({
      domain: 'normative',
      signal_type: 'create',
      candidate_from: taskId,
      candidate_relation: 'violated',
      candidate_to: 'docs/HALT.md',
      confidence: 0.8,
      event: `govern_violation:${taskId}:${violation}`,
    });
  }

  private async appendInbox(taskId: string, type: string, evidence: string): Promise<void> {
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const entry = `\n## [${ts}] ${type} | ${taskId}\nEvidence: ${evidence}\n`;
    const inboxPath = this.pathResolver.inbox;
    let existing = '';
    try {
      existing = await this.fileSystem.readFile(inboxPath);
    } catch {
      // If INBOX.md doesn't exist, start with just the entry
    }
    await this.fileSystem.writeFile(inboxPath, existing + entry);
  }

  private async getArchiveCandidateContent(sourcePath: string, targetPath: string): Promise<string | null> {
    if (await this.fileSystem.exists(sourcePath)) {
      return this.fileSystem.readFile(sourcePath);
    }
    if (await this.fileSystem.exists(targetPath)) {
      return this.fileSystem.readFile(targetPath);
    }
    return null;
  }

  private validateMetaLineFormat(taskId: string, content: string): string | null {
    const metaLine = content.match(/^\*\*Meta:\*\*\s+(.+)$/m)?.[1];
    if (!metaLine) return `${taskId}: missing **Meta:** line`;

    const fields = metaLine.split('|').map(f => f.trim());
    const priority = fields[0];
    const size = fields[1];
    const statusField = fields.find(f => ['DONE', 'REJECTED', 'READY', 'IN_PROGRESS', 'REVIEW', 'BLOCKED'].includes(f));

    const validPriorities = new Set(['P0', 'P1', 'P2', 'P3']);
    const validSizes = new Set(['XS', 'S', 'M', 'L', 'XL']);

    if (!validPriorities.has(priority)) {
      return `${taskId}: malformed meta line — invalid priority '${priority}' (expected P0-P3)`;
    }
    if (!validSizes.has(size)) {
      return `${taskId}: malformed meta line — invalid size '${size}' (expected XS/S/M/L/XL)`;
    }
    if (!statusField) {
      return `${taskId}: malformed meta line — no valid status found (expected DONE/REJECTED/etc.)`;
    }
    return null;
  }

  private async validateHanseiRequirement(taskId: string, content: string): Promise<string | null> {
    if (!content.includes('| DONE |')) {
      return null;
    }

    const config = await ConfigLoader.load(this.fileSystem);
    const hanseiSinceTaskId = config.hanseiSinceTaskId as number | undefined;
    const taskNumber = parseInt(taskId.replace('TASK-', ''), 10);

    if (hanseiSinceTaskId === undefined || Number.isNaN(taskNumber) || taskNumber < hanseiSinceTaskId) {
      return null;
    }

    const metaMatch = content.match(/^\*\*Meta:\*\*\s+[^|]+\|\s*(\S+)\s*\|/m);
    const size = metaMatch?.[1] ?? '';
    if (!['M', 'L', 'XL'].includes(size)) return null;

    if (!content.includes('## Hansei')) {
      return `missing ## Hansei section for post-rollout task (TASK-${hanseiSinceTaskId}+).`;
    }

    const task = await this.taskRepository.getById(taskId);
    if (task) {
      const hanseiErrors = TaskValidator.validateHansei({ ...task, status: TaskStatus.DONE });
      if (hanseiErrors.length > 0) {
        return `Hansei validation failed:\n- ${hanseiErrors.join('\n- ')}`;
      }
    }

    return null;
  }
}
