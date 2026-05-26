import { Command } from '../../domain/models/command.js';
import { MoveArtifact } from '../use-cases/move-artifact.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class MoveCommand implements Command {
  private useCase: MoveArtifact;

  constructor(
    taskRepository: TaskRepository,
    gitRepository: GitRepository,
    fileSystem: FileSystem
  ) {
    this.useCase = new MoveArtifact(taskRepository, gitRepository, fileSystem);
  }

  async execute(args: string[]): Promise<number> {
    try {
      const source = args[0];
      const destination = args[1];
      await this.useCase.execute(source, destination);
    } catch (error: any) {
      fmt.fail(error.message);
    }
    return 0;
  }
}
