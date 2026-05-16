import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus } from '../../domain/models/task.js';
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
import { stdout } from 'node:process';
import crypto from 'node:crypto';

export class MarkTaskDone {
  private feedbackExtractor = new ExtractContextFeedback();

  constructor(
    private taskRepository: TaskRepository,
    private reviewer: Reviewer,
    private fileSystem: FileSystem,
    private eventRepository?: EventRepository,
    private feedbackRepository?: FeedbackRepository,
    private causalSignalLog?: CausalSignalLog,
    private eventLogger?: EventLogger
  ) {}

  async execute(taskId: string, force = false) {
    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (!force) {
      const reviewResult = this.reviewer.reviewTask({ ...task, status: TaskStatus.DONE }, task.rawMetaLine);
      if (!reviewResult.valid) {
        throw new Error(`Cannot mark ${taskId} as DONE due to violations:\n- ${reviewResult.violations.join('\n- ')}`);
      }

      const hanseiRequirement = await this.validateHanseiRequirement(task.id, task.content, task.hansei);
      if (hanseiRequirement) {
        // Try to fill Hansei interactively before blocking
        if (stdout.isTTY) {
          const { HanseiWizard } = await import('./hansei-wizard.js');
          const wizard = new HanseiWizard();
          if (!HanseiWizard.isHanseiComplete(task.content ?? '')) {
            const hanseiBlock = await wizard.run(task);
            // Write Hansei block to task file
            const currentContent = await this.fileSystem.readFile(`docs/tasks/${taskId}.md`);
            const hasSection = currentContent.includes('## Hansei');
            const newContent = hasSection
              ? currentContent.replace(/## Hansei[\s\S]*$/, hanseiBlock)
              : currentContent.trimEnd() + '\n\n' + hanseiBlock;
            await this.fileSystem.writeFile(`docs/tasks/${taskId}.md`, newContent);
            // Re-read task from file
            task.content = newContent;
          }
        } else {
          throw new Error(`Hansei required. Run in a TTY or pre-fill ## Hansei in the task file.`);
        }
      }

      const hanseiErrors = TaskValidator.validateHansei({ ...task, status: TaskStatus.DONE });
      if (hanseiErrors.length > 0) {
        throw new Error(`Cannot mark ${taskId} as DONE — Hansei validation failed:\n- ${hanseiErrors.join('\n- ')}`);
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
    task.focus = false;
    if (!task.closedAt) {
      task.closedAt = new Date().toISOString();
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
      await this.emitCompletionSignals(taskId, task.content ?? '', task.depends ?? []);

      // Route H2/H3 Hansei signals to causal graph
      if (task.hansei && (task.hansei.severity === 'H2' || task.hansei.severity === 'H3a' || task.hansei.severity === 'H3b')) {
        const router = new SignalRouter(this.causalSignalLog);
        await router.route({ taskId, title: task.title, hansei: task.hansei });
      }
    }

    return task;
  }


  private async tryL3Gate(task: Task): Promise<{ passed: boolean; evidence: import('../../domain/services/deterministic-ac-verifier.js').ACEvidence[] }> {
    const L3_SIZES = ['XS', 'S'];
    if (!L3_SIZES.includes(task.size?.trim() ?? '')) {
      return { passed: false, evidence: [] };
    }

    const verifier = new DeterministicACVerifier();
    const result = await verifier.verify(task);

    if (!result.pass) return { passed: false, evidence: result.evidence };

    // Require at least one deterministic (cmd/file) AC — pure-prose tasks need human review
    const hasVerifiable = result.evidence.some(e => e.type === 'cmd' || e.type === 'file');
    if (!hasVerifiable) return { passed: false, evidence: result.evidence };

    // Gate passed — write approval
    if (task.content && !task.content.includes('## Approval')) {
      task.content = task.content.rstrip ? task.content : task.content;
      // Approval will be written by writeL3InboxEntry via taskRepository.save
    }

    return { passed: true, evidence: result.evidence };
  }

  private async writeL3InboxEntry(task: Task, evidence: import('../../domain/services/deterministic-ac-verifier.js').ACEvidence[]): Promise<void> {
    try {
      const inboxPath = 'docs/INBOX.md';
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

  private async emitCompletionSignals(taskId: string, content: string, depends: string[]): Promise<void> {
    const event = `task_completed:${taskId}`;

    // Emit implements signal for each referenced ADR
    const adrMatches = content.matchAll(/\*\*ADR:\*\*\s*(ADR-\d+)/g);
    for (const match of adrMatches) {
      await this.causalSignalLog!.append({
        domain: 'ontological',
        signal_type: 'create',
        candidate_from: taskId,
        candidate_relation: 'implements',
        candidate_to: match[1],
        confidence: 0.6,
        event,
      });
    }

    // Emit fixes signal for each dependency (task completion is evidence deps were causal)
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
  }

  private async validateHanseiRequirement(taskId: string, content: string, hansei?: unknown): Promise<string | null> {
    const configRaw = await this.fileSystem.readFile('arch.config.json');
    const config = JSON.parse(configRaw);
    const hanseiSinceTaskId = config.hanseiSinceTaskId as number | undefined;
    const taskNumber = parseInt(taskId.replace('TASK-', ''), 10);

    if (hanseiSinceTaskId === undefined || Number.isNaN(taskNumber) || taskNumber < hanseiSinceTaskId) {
      return null;
    }

    if (!hansei && !content.includes('## Hansei')) {
      return `missing ## Hansei section for post-rollout task (TASK-${hanseiSinceTaskId}+).`;
    }

    return null;
  }
}
