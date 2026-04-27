import { SelectNextTask } from '../use-cases/select-next-task.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';

export class NextCommand {
  private useCase: SelectNextTask;

  constructor(taskRepository: TaskRepository) {
    this.useCase = new SelectNextTask(taskRepository);
  }

  async execute(): Promise<void> {
    const nextTask = await this.useCase.execute();
    if (nextTask) {
      console.log(nextTask.id);
    } else {
      process.exit(1);
    }
  }
}
