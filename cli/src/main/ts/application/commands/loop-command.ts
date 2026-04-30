import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { LoopEngine, LoopOptions } from '../use-cases/loop-engine.js';

export class LoopCommand {
  private useCase: LoopEngine;

  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository
  ) {
    this.useCase = new LoopEngine(taskRepository, gitRepository);
  }

  async execute(args: string[]): Promise<void> {
    const options: LoopOptions = {
      dryRun: args.includes('--dry-run'),
      resume: args.includes('--resume'),
      sprint: this.parseSprint(args)
    };

    await this.useCase.execute(options);
  }

  private parseSprint(args: string[]): string | undefined {
    const index = args.indexOf('--sprint');
    if (index !== -1 && index + 1 < args.length) {
      return args[index + 1];
    }
    return undefined;
  }
}
