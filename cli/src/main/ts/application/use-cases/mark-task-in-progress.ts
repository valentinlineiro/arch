import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus } from '../../domain/models/task.js';

export class MarkTaskInProgress {
  constructor(private taskRepository: TaskRepository) {}

  async execute(taskId: string, user: string) {
    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== TaskStatus.READY) {
      throw new Error(`Task ${taskId} is not in READY state`);
    }

    task.status = TaskStatus.IN_PROGRESS;
    task.lockedBy = user;
    task.lockedAt = new Date().toISOString();

    await this.taskRepository.save(task);
    return task;
  }
}
