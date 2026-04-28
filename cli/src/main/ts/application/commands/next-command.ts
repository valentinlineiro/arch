import { SelectNextTask } from '../use-cases/select-next-task.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';

export class NextCommand {
  private useCase: SelectNextTask;

  constructor(private taskRepository: TaskRepository, private args: string[] = []) {
    this.useCase = new SelectNextTask(taskRepository);
  }

  async execute(): Promise<void> {
    const nextTask = await this.useCase.execute();
    if (nextTask) {
      if (this.args.includes('--format')) {
        console.log(`${nextTask.id}:${nextTask.class}:${nextTask.size}`);
      } else {
        console.log(nextTask.id);
      }
    } else {
      process.exit(1);
    }
  }
}
