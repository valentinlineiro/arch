import { Task, TaskStatus } from '../../domain/models/task.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';

export class RejectStaleTask {
  constructor(private taskRepository: TaskRepository) {}

  async execute(taskId: string): Promise<Task> {
    const task = await this.taskRepository.getById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    
    const validStatuses = [TaskStatus.READY, TaskStatus.BLOCKED];
    if (!validStatuses.includes(task.status)) {
      throw new Error(`Task ${taskId} is in ${task.status} status and cannot be rejected as stale. Only READY or BLOCKED tasks can be rejected as stale.`);
    }

    task.status = TaskStatus.REJECTED;
    task.lockedBy = undefined;
    task.lockedAt = undefined;
    task.rejectedAt = new Date().toISOString();
    task.rejectionReason = 'stale';

    await this.taskRepository.save(task);
    return task;
  }
}
