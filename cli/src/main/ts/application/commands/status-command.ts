import { GetSprintStatus } from '../use-cases/get-sprint-status.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class StatusCommand {
  private useCase: GetSprintStatus;

  constructor(taskRepository: TaskRepository, fileSystem: FileSystem) {
    this.useCase = new GetSprintStatus(taskRepository, fileSystem);
  }

  async execute(): Promise<void> {
    const status = await this.useCase.execute();
    fmt.header('Sprint Status');
    console.log(`  READY: ${status.ready} | IN_PROGRESS: ${status.inProgress} | REVIEW: ${status.review} | DONE: ${status.done}\n`);

    if (status.sprint) {
      console.log(`  Current Sprint: ${status.sprint.name}`);
      console.log(`  Progress: ${status.sprint.done}/${status.sprint.total} tasks done\n`);
    }
  }
}
