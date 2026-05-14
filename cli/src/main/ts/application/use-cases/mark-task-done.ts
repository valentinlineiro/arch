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
        throw new Error(`Cannot mark ${taskId} as DONE:\n- ${hanseiRequirement}`);
      }

      const hanseiErrors = TaskValidator.validateHansei({ ...task, status: TaskStatus.DONE });
      if (hanseiErrors.length > 0) {
        throw new Error(`Cannot mark ${taskId} as DONE — Hansei validation failed:\n- ${hanseiErrors.join('\n- ')}`);
      }
    }

    const fromStatus = task.status;
    task.status = TaskStatus.DONE;
    task.focus = false;
    if (!task.closedAt) {
      task.closedAt = new Date().toISOString();
    }
    await this.taskRepository.save(task);

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
    }

    return task;
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
