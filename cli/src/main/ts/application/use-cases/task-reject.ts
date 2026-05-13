import { Task, TaskStatus } from '../../domain/models/task.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import { EventLogger } from '../../domain/services/event-logger.js';

export class RejectTask {
  constructor(
    private taskRepository: TaskRepository,
    private eventLogger?: EventLogger
  ) {}

  async execute(taskId: string, reason: string): Promise<Task> {
    const task = await this.taskRepository.getById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    if (task.status !== TaskStatus.REVIEW) throw new Error(`Task ${taskId} is not in REVIEW state`);

    const fromStatus = task.status;
    task.status = TaskStatus.READY;
    task.lockedBy = undefined;
    task.lockedAt = undefined;
    task.rejectedAt = new Date().toISOString();
    task.rejectionReason = reason;

    await this.taskRepository.save(task);

    if (this.eventLogger) {
      await this.eventLogger.append({
        taskId: task.id,
        from: fromStatus,
        to: task.status,
        timestamp: new Date().toISOString()
      });
    }

    return task;
  }
}
