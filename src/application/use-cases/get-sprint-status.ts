import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus } from '../../domain/models/task.js';

export class GetSprintStatus {
  constructor(private taskRepository: TaskRepository) {}

  async execute() {
    const tasks = await this.taskRepository.getAll();
    const ready = tasks.filter(t => t.status === TaskStatus.READY).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const review = tasks.filter(t => t.status === TaskStatus.REVIEW).length;
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;

    return {
      ready,
      inProgress,
      review,
      done,
      total: tasks.length,
      tasks: tasks.map(t => ({ id: t.id, title: t.title, status: t.status }))
    };
  }
}
