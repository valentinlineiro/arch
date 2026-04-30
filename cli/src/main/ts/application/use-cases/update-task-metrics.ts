import { TaskRepository } from '../../domain/repositories/task-repository.js';

export class UpdateTaskMetrics {
  constructor(private taskRepository: TaskRepository) {}

  async execute(taskId: string, options: { cost?: number; steps?: number; addCost?: number; addSteps?: number }) {
    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (options.cost !== undefined) {
      task.cost = options.cost;
    } else if (options.addCost !== undefined) {
      task.cost = (task.cost || 0) + options.addCost;
    }

    if (options.steps !== undefined) {
      task.steps = options.steps;
    } else if (options.addSteps !== undefined) {
      task.steps = (task.steps || 0) + options.addSteps;
    }

    await this.taskRepository.save(task);
    return task;
  }
}
