import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus, FocusLevel } from '../../domain/models/task.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import { TaskValidator } from '../../domain/services/task-validator.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { EventRepository } from '../../domain/models/event.js';
import { FeedbackRepository } from '../../domain/repositories/feedback-repository.js';
import { ExtractContextFeedback } from './extract-context-feedback.js';
import { CausalSignalLog } from './causal-signal-log.js';
import { EventLogger } from '../../domain/services/event-logger.js';
import { DeterministicACVerifier } from '../../domain/services/deterministic-ac-verifier.js';
import { SignalRouter } from '../../domain/services/signal-router.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import { computeTrustedMetrics } from './compute-trusted-metrics.js';
import { LightweightMetricsRefresh } from './lightweight-metrics-refresh.js';
import { TemporalIndex } from './temporal-index.js';
import type { Task } from '../../domain/models/task.js';
import { stdout } from 'node:process';
import crypto from 'node:crypto';
import { PathResolver } from '../../domain/services/path-resolver.js';
import { isHanseiBlocking } from '../../domain/models/config.js';

export class MarkTaskDone {
  private feedbackExtractor = new ExtractContextFeedback();

  constructor(
    private taskRepository: TaskRepository,
    private reviewer: Reviewer,
    private fileSystem: FileSystem,
    private eventRepository?: EventRepository,
    private feedbackRepository?: FeedbackRepository,
    private causalSignalLog?: CausalSignalLog,
    private eventLogger?: EventLogger,
    private gitRepository?: GitRepository,
    private metricsRefresh?: LightweightMetricsRefresh,
    private temporalIndex?: TemporalIndex,
  ) {}

  async execute(taskId: string, force = false) {
    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Compute turn count from git log if lockedCommit is available — needed for Hansei trigger
    if (this.gitRepository && task.lockedCommit && !task.turns) {
      try {
        const count = await this.gitRepository.getCommitCountBetween(task.lockedCommit);
        if (count !== null) {
          task.turns = count;
        }
      } catch { /* non-blocking */ }
    }

    if (!force) {
      const reviewResult = this.reviewer.reviewTask({ ...task, status: TaskStatus.DONE }, task.rawMetaLine);
      if (!reviewResult.valid) {
        throw new Error(`Cannot mark ${taskId} as DONE due to violations:\n- ${reviewResult.violations.join('\n- ')}`);
      }

      const hanseiTrigger = await this.validateHanseiRequirement(task);
      if (hanseiTrigger) {
        // Try to fill Hansei interactively before blocking
        if (stdout.isTTY) {
          const { HanseiWizard } = await import('./hansei-wizard.js');
          const wizard = new HanseiWizard();
          if (!HanseiWizard.isHanseiComplete(task.content ?? '')) {
            const hanseiBlock = await wizard.run(task, this.gitRepository, hanseiTrigger);
            // Write Hansei block to task file
            const pr = PathResolver.from({});
            const currentContent = await this.fileSystem.readFile(`${pr.tasks}/${taskId}.md`);
            const hasSection = currentContent.includes('## Hansei');
            const newContent = hasSection
              ? currentContent.replace(/## Hansei[\s\S]*$/, hanseiBlock)
              : currentContent.trimEnd() + '\n\n' + hanseiBlock;
            await this.fileSystem.writeFile(`${pr.tasks}/${taskId}.md`, newContent);
            // Re-read task from file
            task.content = newContent;
          }
        } else {
          throw new Error(`Hansei required (${hanseiTrigger}). Run in a TTY or pre-fill ## Hansei in the task file.`);
        }
      }

      const configRaw2 = await this.fileSystem.readFile('arch.config.json').catch(() => '{}');
      const config2 = JSON.parse(configRaw2);
      const hanseiBlocking = isHanseiBlocking(config2);
      if (!hanseiBlocking) {
        const advisoryErrors = TaskValidator.validateHansei({ ...task, status: TaskStatus.DONE });
        if (advisoryErrors.length > 0) {
          console.warn(`  [ADVISORY] Hansei validation warnings (non-blocking):\n- ${advisoryErrors.join('\n- ')}`);
        }
      } else {
        const hanseiErrors = TaskValidator.validateHansei({ ...task, status: TaskStatus.DONE });
        const isXS = task.size === 'XS';
        const acResult2 = await (new DeterministicACVerifier()).verify(task);
        const allCmdPass = acResult2.evidence.filter(e => e.type === 'cmd').every(e => e.pass);
        const xsFiltered = isXS && allCmdPass
          ? hanseiErrors.filter(e =>
              !e.includes('placeholder') &&
              !e.includes('Forward Action') &&
              !e.includes('too brief') &&
              !e.includes('specific references') &&
              !e.includes('H0 requires a justification')
            )
          : hanseiErrors;
        if (xsFiltered.length > 0) {
          throw new Error(`Cannot mark ${taskId} as DONE — Hansei validation failed:\n- ${xsFiltered.join('\n- ')}`);
        }
      }

      // AC structural verification — block if any cmd: or file: predicate fails
      const verifier = new DeterministicACVerifier();
      const acResult = await verifier.verify(task);
      if (!acResult.pass) {
        const failed = acResult.evidence.filter(e => !e.pass);
        const lines = failed.map(e => `  [${e.type}] ${e.ac}: ${e.detail.split('\n')[0]}`);
        throw new Error(`Cannot mark ${taskId} as DONE — AC verification failed:\n${lines.join('\n')}`);
      }
    }

    const fromStatus = task.status;
    task.status = TaskStatus.DONE;
    task.focus = FocusLevel.NONE;
    if (!task.closedAt) {
      task.closedAt = new Date().toISOString();
    }

    // Compute turn count from git log if lockedCommit is available
    if (this.gitRepository && task.lockedCommit && !task.turns) {
      try {
        const count = await this.gitRepository.getCommitCountBetween(task.lockedCommit);
        if (count !== null) {
          task.turns = count;
        }
      } catch { /* non-blocking */ }
    }

    // L3 self-archive gate — only for XS/S tasks with all verifiable ACs passing
    const l3Result = await this.tryL3Gate(task);

    await this.taskRepository.save(task);

    // Write L3 INBOX entry if gate passed
    if (l3Result.passed) {
      await this.writeL3InboxEntry(task, l3Result.evidence);
    }

    if (this.eventLogger) {
      await this.eventLogger.append({
        taskId: task.id,
        from: fromStatus,
        to: task.status,
        timestamp: new Date().toISOString()
      });
    }

    if (this.eventRepository) {
      await this.eventRepository.append({
        id: crypto.randomUUID(),
        type: 'TASK_COMPLETED',
        timestamp: new Date().toISOString(),
        subject: taskId,
        payload: {
          cost: task.cost,
          steps: task.steps
        }
      });
    }

    if (this.feedbackRepository) {
      const signal = this.feedbackExtractor.extract(taskId, task.content ?? '');
      if (signal) {
        await this.feedbackRepository.append(signal);
      }
    }

    if (this.causalSignalLog) {
      await this.emitCompletionSignals(taskId, task.content ?? '', task.depends ?? [], task.hansei);

      // Route H2/H3 Hansei signals to causal graph
      if (task.hansei && (task.hansei.severity === 'H2' || task.hansei.severity === 'H3a' || task.hansei.severity === 'H3b')) {
        const router = new SignalRouter(this.causalSignalLog);
        await router.route({ taskId, title: task.title, hansei: task.hansei });
      }
    }

    if (this.temporalIndex && task.hansei?.category) {
      await this.temporalIndex.appendAndDetect(
        taskId,
        [task.hansei.category],
        this.causalSignalLog,
      );
    }

    if (this.metricsRefresh) {
      try {
        const metrics = await computeTrustedMetrics(this.fileSystem);
        await this.metricsRefresh.execute(metrics);
      } catch (err) {
        // non-fatal — metrics refresh failure does not affect task operations
        if (process.env.ARCH_DEBUG) console.error('[TASK-257] metrics refresh failed:', err);
      }
    }

    // Refinement archival gate: when a task closes, archive any IDEA with Decision: PROMOTE → taskId
    try {
      const { readdir, readFile, writeFile, rename, mkdir } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const pr = PathResolver.from({});
      const refinementDir = join(this.rootPath ?? '.', pr.refinement ?? 'docs/refinement');
      const archiveDir = join(refinementDir, 'archive');
      await mkdir(archiveDir, { recursive: true });
      const ideaFiles = await readdir(refinementDir).catch(() => [] as string[]);
      for (const file of ideaFiles.filter(f => f.startsWith('IDEA-') && f.endsWith('.md'))) {
        const content = await readFile(join(refinementDir, file), 'utf8').catch(() => '');
        if (content.includes(`PROMOTE → ${taskId}`) || content.includes(`PROMOTE -> ${taskId}`)) {
          const updated = content.replace(/\*\*Status:\*\* \S+/, '**Status:** ARCHIVED');
          await writeFile(join(archiveDir, file), updated);
          await rename(join(refinementDir, file), join(archiveDir, file)).catch(() => {
            // rename may fail if writeFile already wrote it — OK
          });
        }
      }
    } catch { /* non-blocking */ }

    return task;
  }


  private async tryL3Gate(task: Task): Promise<{ passed: boolean; evidence: import('../../domain/services/deterministic-ac-verifier.js').ACEvidence[] }> {
    const size = task.size?.trim() ?? '';
    const cls = (task as any).class?.trim() ?? '';
    const M_ELIGIBLE_CLASSES = ['6-writing', '7-operations'];
    const isStandardL3 = ['XS', 'S'].includes(size);
    const isMExtended = size === 'M' && M_ELIGIBLE_CLASSES.includes(cls);

    if (!isStandardL3 && !isMExtended) {
      return { passed: false, evidence: [] };
    }

    const verifier = new DeterministicACVerifier();
    const result = await verifier.verify(task);

    if (!result.pass) return { passed: false, evidence: result.evidence };

    // Require at least one deterministic (cmd/file) AC — pure-prose tasks need human review
    const DETERMINISTIC_TYPES = new Set(['cmd', 'file', 'file-contains', 'not-file']);
    const hasVerifiable = result.evidence.some(e => DETERMINISTIC_TYPES.has(e.type));
    if (!hasVerifiable) return { passed: false, evidence: result.evidence };

    // M extended gate: all ACs must be deterministic, and no protected path modified
    if (isMExtended) {
      const NON_DETERMINISTIC = new Set(['prose', 'code', 'unknown']);
      if (result.evidence.some(e => NON_DETERMINISTIC.has(e.type))) {
        return { passed: false, evidence: result.evidence };
      }
      if (await this.hasProtectedPathModified()) {
        return { passed: false, evidence: result.evidence };
      }
    }

    return { passed: true, evidence: result.evidence };
  }

  private async hasProtectedPathModified(): Promise<boolean> {
    if (!this.gitRepository) return false;
    try {
      const { ConfigLoader } = await import('../../domain/services/config-loader.js');
      const config = await ConfigLoader.load(this.fileSystem);
      const protectedPaths: string[] = config.governance?.protectedPaths ?? [];
      if (protectedPaths.length === 0) return false;
      const changed = await this.gitRepository.getChangedFilesInLastCommit();
      return changed.some(f => protectedPaths.some(p => f.startsWith(p)));
    } catch {
      return false;
    }
  }

  private async writeL3InboxEntry(task: Task, evidence: import('../../domain/services/deterministic-ac-verifier.js').ACEvidence[]): Promise<void> {
    try {
      const inboxPath = PathResolver.from({}).inbox;
      const timestamp = new Date().toISOString();

      const evidenceTable = [
        '| AC | Type | Pass | Detail |',
        '|---|---|---|---|',
        ...evidence.map(e => `| ${e.ac.slice(0, 60)} | ${e.type} | ${e.pass ? '✔' : '✖'} | ${e.detail.split('\n')[0].slice(0, 60)} |`),
      ].join('\n');

      const entry = `\n## [AWAITING_REVIEW] ${task.id} [L3-AUTO]\n**Closed:** ${timestamp}\n**Title:** ${task.title}\n\n${evidenceTable}\n`;

      const existing = await this.fileSystem.readFile(inboxPath).catch(() => '');
      await this.fileSystem.writeFile(inboxPath, existing + entry);
    } catch { /* non-blocking */ }
  }

  private async emitCompletionSignals(taskId: string, content: string, depends: string[], hansei?: Task['hansei']): Promise<void> {
    if (!content && depends.length === 0 && !hansei) return;

    const event = `task_completed:${taskId}`;

    // Emit implements signal for explicit ADR references:
    // - **ADR:** ADR-XXX metadata fields
    // - bare ADR-XXX tokens NOT embedded in file paths (i.e., not preceded by '/')
    const adrRefs = new Set<string>();
    for (const m of content.matchAll(/\*\*ADR:\*\*\s*(ADR-\d+)/g)) {
      adrRefs.add(m[1]);
    }
    for (const m of content.matchAll(/ADR-\d+/g)) {
      const before = m.index! > 0 ? content[m.index! - 1] : '';
      if (before !== '/') adrRefs.add(m[0]);
    }
    for (const adr of adrRefs) {
      await this.causalSignalLog!.append({
        domain: 'ontological',
        signal_type: 'create',
        candidate_from: taskId,
        candidate_relation: 'implements',
        candidate_to: adr,
        confidence: 0.5,
        event,
      });
    }

    // Emit caused_by signal for each TASK-ID in the Depends field
    for (const dep of depends) {
      if (dep === 'none' || !dep.startsWith('TASK-')) continue;
      await this.causalSignalLog!.append({
        domain: 'ontological',
        signal_type: 'create',
        candidate_from: taskId,
        candidate_relation: 'caused_by',
        confidence: 0.5,
        candidate_to: dep,
        event,
      });
    }

    // Emit category classification signal when a valid Hansei category is present
    if (hansei?.category && hansei.category.trim().length > 0) {
      await this.causalSignalLog!.append({
        domain: 'epistemological',
        signal_type: 'create',
        candidate_from: taskId,
        candidate_relation: 'references',
        candidate_to: `category:${hansei.category}`,
        confidence: 0.5,
        event,
      });
    }
  }

  private async validateHanseiRequirement(task: Task): Promise<string | null> {
    const configRaw = await this.fileSystem.readFile('arch.config.json');
    const config = JSON.parse(configRaw);
    const size = task.size?.trim();
    const turns = task.turns;

    // Profile/module gate — skip Hansei blocking if non-blocking mode
    if (!isHanseiBlocking(config)) return null;

    // Trigger 1: Turn count delta (Process health trigger)
    const turnBudget = size ? config.muri?.[size]?.turns : undefined;
    if (turns && turnBudget && turns > turnBudget) {
      if (!task.hansei && !(task.content && task.content.includes('## Hansei'))) {
        return `turn count ${turns} exceeds budget for size ${size} (${turnBudget})`;
      }
    }

    // XS/S: otherwise exempt from mandatory Hansei (TASK-934)
    if (size && !['M', 'L', 'XL'].includes(size)) return null;

    // Trigger 2: Size M+ (Constitutional mandate)
    if (size && ['M', 'L', 'XL'].includes(size)) {
      if (!task.hansei && !(task.content && task.content.includes('## Hansei'))) {
        return `size ${size} requires mandatory Hansei block`;
      }
    }

    // Legacy trigger for rollout phase (for M+ tasks)
    const hanseiSinceTaskId = config.governance?.hanseiSinceTaskId ?? config.hanseiSinceTaskId;
    const taskNumber = parseInt(task.id.replace('TASK-', ''), 10);
    if (hanseiSinceTaskId !== undefined && !Number.isNaN(taskNumber) && taskNumber >= hanseiSinceTaskId) {
      if (!task.hansei && !(task.content && task.content.includes('## Hansei'))) {
        return `missing ## Hansei section for post-rollout task (TASK-${hanseiSinceTaskId}+).`;
      }
    }

    return null;
  }
}
