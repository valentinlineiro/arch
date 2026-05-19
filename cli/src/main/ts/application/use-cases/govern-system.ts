import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { Task, TaskStatus } from '../../domain/models/task.js';
import { BatchSystem } from './batch-system.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import { CausalSignalLog } from './causal-signal-log.js';
import { ReflectInfluenceReport, DEFAULT_THRESHOLDS } from './reflect-influence-report.js';
import { TaskValidator } from '../../domain/services/task-validator.js';
import { CorpusAuditCommand } from '../commands/corpus-audit-command.js';
import {
  FocusRuling, LedgerState, FOCUS_LEDGER_PATH,
  parseLedger, committedRulings, serializeLedger,
} from './focus-ledger.js';
import { computeTrustedMetrics } from './compute-trusted-metrics.js';
import { LightweightMetricsRefresh } from './lightweight-metrics-refresh.js';
import { readDeepAnalysisState, isDeepAnalysisDue } from './deep-analysis-state.js';
import { hasOverdueWeakSignal } from './weak-signal-checker.js';

export interface GovernResult {
  analysisNeeded: boolean;
  reasons: string[];
}

export class GovernSystem {
  private batchSystem: BatchSystem;

  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem,
    private causalSignalLog?: CausalSignalLog,
    private rootPath: string = '.'
  ) {
    this.batchSystem = new BatchSystem(fileSystem);
  }

  async execute(noConduct = false): Promise<GovernResult> {
    const config = await ConfigLoader.load(this.fileSystem);
    const conductEveryN = config.governance?.conductEveryN ?? 3;
    const analysisReasons: string[] = [];

    // 0. Batch Drain
    await this.batchSystem.drain();

    // 0.1 Archival Guard — Auto-archive DONE/REJECTED tasks from tasksDir
    try {
      await this.archiveDoneTasks();
    } catch (error: any) {
      throw error; // Halt execution on archival escalation
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
          console.log(`  \x1b[31m✖ CORPUS HALT: score ${score}/100 < ${haltThreshold}. See docs/INBOX.md.\x1b[0m`);
        } else if (score < warnThreshold) {
          const msg = `Corpus quality score ${score}/100 is below warn threshold (${warnThreshold}). Governance suggestions shown with reduced confidence. Run arch corpus audit --verbose.`;
          await this.appendInbox('CORPUS', 'CORPUS_ALERT', msg);
          console.log(`  \x1b[33m⚠ CORPUS ALERT: score ${score}/100 < ${warnThreshold}. See docs/INBOX.md.\x1b[0m`);
        } else {
          console.log(`  \x1b[32m✔\x1b[0m Corpus quality: ${score}/100`);
        }
      } catch (err) {
        if (process.env.ARCH_DEBUG) console.error('[corpus-audit] audit failed:', err);
        // non-fatal — audit failure does not block governance
      }
    }

    return { analysisNeeded: analysisReasons.length > 0, reasons: analysisReasons };
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

  private priorityNum(p: string): number {
    return parseInt(p.replace('P', ''), 10);
  }

  private isEligible(task: Task, doneTaskIds: Set<string>): boolean {
    if (task.status !== TaskStatus.READY) return false;
    if (task.focus) return false;
    const deps = (task.depends ?? []).filter(d => d.toLowerCase() !== 'none');
    return deps.every(dep => doneTaskIds.has(dep));
  }

  private isEligibleAfterFix(task: Task, doneTaskIds: Set<string>, fixedIds: Set<string>): boolean {
    if (task.status !== TaskStatus.READY) return false;
    if (task.focus && !fixedIds.has(task.id)) return false;
    const deps = (task.depends ?? []).filter(d => d.toLowerCase() !== 'none');
    return deps.every(dep => doneTaskIds.has(dep));
  }

  private isFocusRetainable(task: Task, doneTaskIds: Set<string>): boolean {
    if (task.status !== TaskStatus.READY) return false;
    const deps = (task.depends ?? []).filter(d => d.toLowerCase() !== 'none');
    return deps.every(dep => doneTaskIds.has(dep));
  }

  private get ledgerPath(): string {
    return this.rootPath && this.rootPath !== '.' ? `${this.rootPath}/${FOCUS_LEDGER_PATH}` : FOCUS_LEDGER_PATH;
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
    const filePath = `docs/tasks/${task.id}.md`;
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

    await this.fileSystem.writeFile(ledgerPath, content);

    // Stage and commit only the ledger — task meta files are updated on disk
    // but not committed by govern (pre-commit hook requires Hansei on M+ task files,
    // which govern does not add; the ledger is the durable record).
    try { await this.gitRepository.add(ledgerPath); } catch { /* ok */ }

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
    for (const t of activeTasks.filter(t => t.focus)) {
      const hasAcquisition = committed.some(r => r.action === 'FOCUS_ACQUIRED' && r.taskId === t.id);
      if (!hasAcquisition) {
        integrityFixedIds.add(t.id);
        newRulings.push({ tick: nextTick, taskId: t.id, action: 'INTEGRITY_FIX', timestamp: new Date().toISOString() });
        const changed = await this.updateFocusFlag(t, false);
        if (changed) changedFiles.push(`docs/tasks/${t.id}.md`);
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
        if (changed) changedFiles.push(`docs/tasks/${top.id}.md`);
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
      if (cleared) changedFiles.push(`docs/tasks/${focused.id}.md`);
      if (eligible.length > 0) {
        const top = eligible[0];
        newRulings.push({ tick: nextTick, taskId: top.id, action: 'FOCUS_ACQUIRED', previousTask: focused.id, timestamp: new Date().toISOString() });
        const changed = await this.updateFocusFlag(top, true);
        if (changed) changedFiles.push(`docs/tasks/${top.id}.md`);
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
      if (clearedOld) changedFiles.push(`docs/tasks/${focused.id}.md`);
      const changedNew = await this.updateFocusFlag(preemptor, true);
      if (changedNew) changedFiles.push(`docs/tasks/${preemptor.id}.md`);
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

      const breachLogPath = `${this.rootPath}/.arch/reflect-breach-log.jsonl`;
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
            const persistMsg = `Persistent breach (${newConsecutive} consecutive cycles): ${violation!.message}`;
            await this.appendInbox('REFLECT', 'INFLUENCE_BREACH_PERSISTENT', persistMsg);
            console.log(`  ✖ REFLECT persistent breach: ${persistMsg}`);
          } else {
            console.log(`  ⚠ REFLECT breach continues (${newConsecutive}/${thresholds.persistenceN}): ${violation!.message}`);
          }
        } else if (wasBreachedLastTick) {
          const clearMsg = `${rule} threshold breach cleared. Verify: did health improve (more decisions attributed) — or did operators adapt behavior to the threshold (worked around the measurement)? These are opposite outcomes that look identical in the data.`;
          await this.appendInbox('REFLECT', 'INFLUENCE_BREACH_CLEARED', clearMsg);
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
      if (/\[TASK-\d{3}\]/.test(msg)) count++;
    }
    return count;
  }

  private async archiveDoneTasks(): Promise<void> {
    const activeTasks = await this.taskRepository.getActive();
    const toArchive = activeTasks.filter(t => t.status === TaskStatus.DONE || t.status === TaskStatus.REJECTED);

    for (const task of toArchive) {
      await this.archiveFile(task.id);
    }

    const statusLines = await this.gitRepository.getStatusLines();
    const phantomIds = new Set<string>();

    for (const line of statusLines) {
      const match = line.match(/(D docs\/tasks\/|\?\? docs\/archive\/)(TASK-\d{3})\.md/);
      if (match) {
        phantomIds.add(match[2]);
      }
    }

    for (const id of phantomIds) {
      console.log(`  Syncing phantom archive ${id}...`);
      await this.archiveFile(id);
    }
  }

  private async archiveFile(taskId: string): Promise<void> {
    const sourcePath = `docs/tasks/${taskId}.md`;
    const targetPath = `docs/archive/${taskId}.md`;

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
      } else if (await this.fileSystem.exists(targetPath)) {
        await this.gitRepository.add(targetPath);
        const status = await this.gitRepository.getStatusLines();
        if (status.some(l => l.includes(`D docs/tasks/${taskId}.md`))) {
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
    const inboxPath = 'docs/INBOX.md';
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
