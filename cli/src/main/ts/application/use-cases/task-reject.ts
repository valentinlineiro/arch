import { Task, TaskStatus } from '../../domain/models/task.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';

export class RejectTask {
  constructor(private taskRepository: TaskRepository) {}

  async execute(taskId: string, reason: string): Promise<Task> {
    const task = await this.taskRepository.getById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    if (task.status !== TaskStatus.REVIEW) throw new Error(`Task ${taskId} is not in REVIEW state`);

    task.status = TaskStatus.READY;
    task.lockedBy = undefined;
    task.lockedAt = undefined;
    task.rejectedAt = new Date().toISOString();
    task.rejectionReason = reason;

    await this.taskRepository.save(task);
    return task;
  }
}
