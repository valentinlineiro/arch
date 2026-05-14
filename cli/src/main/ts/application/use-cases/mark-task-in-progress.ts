import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus } from '../../domain/models/task.js';
import { EventRepository } from '../../domain/models/event.js';
import crypto from 'node:crypto';

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
}
