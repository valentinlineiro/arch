import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus } from '../../domain/models/task.js';
import { EventRepository } from '../../domain/models/event.js';
import crypto from 'node:crypto';

export class DefinitionOfReadyError extends Error {
  constructor(public readonly reasons: string[]) {
    super(`Task fails Definition of Ready:\n${reasons.map(r => `  - ${r}`).join('\n')}`);
    this.name = 'DefinitionOfReadyError';
  }
}

export class MarkTaskInProgress {
  constructor(
    private taskRepository: TaskRepository,
    private eventRepository?: EventRepository
  ) {}

  async execute(taskId: string, user: string) {
    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== TaskStatus.READY) {
      throw new Error(`Task ${taskId} is not in READY state`);
    }

    // Definition of Ready validation
    const violations = this.checkDefinitionOfReady(task);
    if (violations.length > 0) {
      throw new DefinitionOfReadyError(violations);
    }

    task.status = TaskStatus.IN_PROGRESS;
    task.lockedBy = user;
    task.lockedAt = new Date().toISOString();
    if (!task.createdAt) {
      task.createdAt = task.lockedAt;
    }

    await this.taskRepository.save(task);

    if (this.eventRepository) {
      await this.eventRepository.append({
        id: crypto.randomUUID(),
        type: 'TASK_STARTED',
        timestamp: new Date().toISOString(),
        subject: taskId,
        payload: { actor: user }
      });
    }

    return task;
  }

  private checkDefinitionOfReady(task: { id: string; priority: string; size: string; class: string; cli: string; context: string[]; acceptanceCriteria?: { description: string }[]; content: string }): string[] {
    const reasons: string[] = [];

    if (!task.priority || task.priority.trim() === '') reasons.push('Missing Priority (P0/P1/P2/P3)');
    if (!task.size || task.size.trim() === '') reasons.push('Missing Size (XS/S/M/L)');
    if (!task.class || task.class.trim() === '') reasons.push('Missing task class (e.g. 1-code-reasoning)');
    if (!task.cli || task.cli.trim() === '') reasons.push('Missing CLI provider');
    // context: [] is valid if the raw meta line explicitly declares 'none'
    const hasExplicitNone = task.content.includes('| none') || task.content.includes('| none\n');
    if (!task.context || task.context.length === 0) {
      if (!hasExplicitNone) reasons.push('Missing context paths');
    }

    const hasACs = (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) ||
      task.content.includes('- [ ]') || task.content.includes('- [x]');
    if (!hasACs) reasons.push('No Acceptance Criteria defined');

    // M+ tasks require a Gaps section
    const isMOrLarger = ['M', 'L', 'XL'].includes(task.size?.trim());
    if (isMOrLarger && !task.content.includes('### Gaps')) {
      reasons.push(`Size ${task.size} task is missing a ### Gaps section (required for M+)`);
    }

    return reasons;
  }
}
