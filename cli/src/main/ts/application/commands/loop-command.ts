import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { LoopEngine, LoopOptions } from '../use-cases/loop-engine.js';

export class LoopCommand {
  private engine: LoopEngine;

  constructor(
    taskRepository: TaskRepository,
    gitRepository: GitRepository,
    fileSystem: FileSystem
  ) {
    this.engine = new LoopEngine(taskRepository, gitRepository, fileSystem);
  }

  async execute(args: string[]): Promise<void> {
    const options: LoopOptions = {
      dryRun: args.includes('--dry-run'),
      resume: args.includes('--resume'),
      sprint: this.parseSprint(args),
    };
    await this.engine.execute(options);
  }

  private parseSprint(args: string[]): string | undefined {
    const i = args.indexOf('--sprint');
    return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
  }
}
