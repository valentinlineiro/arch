import { GovernSystem } from '../use-cases/govern-system.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';

export class GovernCommand {
  private useCase: GovernSystem;

  constructor(
    taskRepository: TaskRepository,
    gitRepository: GitRepository,
    fileSystem: FileSystem
  ) {
    this.useCase = new GovernSystem(taskRepository, gitRepository, fileSystem);
  }

  async execute(): Promise<void> {
    console.log('\n  ARCH — Governance Tick');
    await this.useCase.execute();
    console.log('');
  }
}
