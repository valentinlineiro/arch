import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus } from '../../domain/models/task.js';

export class MarkTaskDone {
  constructor(private taskRepository: TaskRepository) {}

  async execute(taskId: string) {
    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // We allow marking as DONE even if not IN_PROGRESS for flexibility (e.g. from REVIEW)
    task.status = TaskStatus.DONE;

    await this.taskRepository.save(task);
    return task;
  }
}
