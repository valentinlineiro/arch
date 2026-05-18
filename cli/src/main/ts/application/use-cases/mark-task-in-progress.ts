import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus } from '../../domain/models/task.js';
import { EventRepository } from '../../domain/models/event.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
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
    private eventRepository?: EventRepository,
    private gitRepository?: GitRepository,
  ) {}

  async execute(taskId: string, user: string) {
    const task = await this.taskRepository.getById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    if (task.status !== TaskStatus.READY) throw new Error(`Task ${taskId} is not in READY state`);

    const violations = this.checkDefinitionOfReady(task);
    if (violations.length > 0) throw new DefinitionOfReadyError(violations);

    task.status = TaskStatus.IN_PROGRESS;
    task.lockedBy = user;
    task.lockedAt = new Date().toISOString();
    if (!task.createdAt) task.createdAt = task.lockedAt;

    // Store the commit SHA at the time of start — deterministic diff boundary
    if (this.gitRepository) {
      try {
        task.lockedCommit = (await this.gitRepository.getLastCommitHash()) ?? undefined;
      } catch { /* non-blocking */ }
    }

    // Resolve actor from routing config
    task.actor = await this.resolveActor(task.class ?? '');

    await this.taskRepository.save(task);

    if (this.eventRepository) {
      await this.eventRepository.append({
        id: crypto.randomUUID(),
        type: 'TASK_STARTED',
        timestamp: new Date().toISOString(),
        subject: taskId,
        payload: { actor: user, lockedCommit: task.lockedCommit },
      });
    }

    return task;
  }

  private checkDefinitionOfReady(task: { id: string; priority: string; size: string; class: string; cli: string; context: string[]; acceptanceCriteria?: { description: string }[]; content: string }): string[] {
    const reasons: string[] = [];

    if (!task.priority?.trim()) reasons.push('Missing Priority (P0/P1/P2/P3) — add to meta line field 1');
    if (!task.size?.trim()) reasons.push('Missing Size (XS/S/M/L) — add to meta line field 2');
    if (!task.class?.trim()) reasons.push('Missing Class (e.g. 1-code-reasoning) — add to meta line field 5');
    if (!task.cli?.trim()) reasons.push('Missing CLI provider (e.g. claude-code) — add to meta line field 6');

    const hasExplicitNone = task.content.includes('| none') || task.content.includes('| none\n');
    if (!task.context || task.context.length === 0) {
      if (!hasExplicitNone) reasons.push('Missing context paths — add file/dir paths to meta line field 7, or use "none"');
    }

    const hasACs = (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) ||
      task.content.includes('- [ ]') || task.content.includes('- [x]');
    if (!hasACs) reasons.push('No Acceptance Criteria — add at least one "- [ ] ..." item under ### Acceptance Criteria');

    const isMOrLarger = ['M', 'L', 'XL'].includes(task.size?.trim());
    if (isMOrLarger && !task.content.includes('### Gaps')) {
      reasons.push(`Size ${task.size} requires a ### Gaps section — add it below ### Context`);
    }

    return reasons;
  }
  private async resolveActor(taskClass: string): Promise<string> {
    try {
      const configRaw = await (this as any).taskRepository?.fileSystem?.readFile?.('arch.config.json') ?? '{}';
      const config = JSON.parse(configRaw);
      const strategies: Record<string, unknown> = config.strategies ?? {};
      // Match by class prefix (e.g. "1-code-reasoning" matches key "1" or full key)
      for (const [key, actor] of Object.entries(strategies)) {
        if ((taskClass.startsWith(key) || taskClass === key) && typeof actor === 'string') return actor;
      }
      return (config.defaultActor ?? 'unknown') as string;
    } catch {
      return 'unknown';
    }
  }

}


