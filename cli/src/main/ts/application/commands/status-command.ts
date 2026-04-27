import { GetSprintStatus } from '../use-cases/get-sprint-status.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class StatusCommand {
  private useCase: GetSprintStatus;

  constructor(taskRepository: TaskRepository) {
    this.useCase = new GetSprintStatus(taskRepository);
  }

  async execute(): Promise<void> {
    const status = await this.useCase.execute();
    fmt.header('Sprint Status');
    console.log(`  READY: ${status.ready} | IN_PROGRESS: ${status.inProgress} | REVIEW: ${status.review} | DONE: ${status.done}\n`);
  }
}
