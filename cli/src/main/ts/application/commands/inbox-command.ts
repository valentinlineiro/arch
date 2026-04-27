import { GenerateInbox } from '../use-cases/generate-inbox.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { Reviewer } from '../../domain/services/reviewer.js';
import type { DriftChecker } from '../../domain/services/drift-checker.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class InboxCommand {
  private useCase: GenerateInbox;

  constructor(
    taskRepository: TaskRepository,
    gitRepository: GitRepository,
    fileSystem: FileSystem,
    reviewer: Reviewer,
    driftChecker: DriftChecker,
  ) {
    this.useCase = new GenerateInbox(taskRepository, gitRepository, fileSystem, reviewer, driftChecker);
  }

  async execute(): Promise<void> {
    try {
      const filePath = await this.useCase.execute();
      fmt.ok(`Inbox updated: ${filePath}\n`);
    } catch (error: any) {
      fmt.warn(error.message);
    }
  }
}
