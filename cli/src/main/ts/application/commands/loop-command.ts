import { Command } from '../../domain/models/command.js';
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import { DriftChecker } from '../use-cases/drift-checker.js';
import { LoopEngine, LoopOptions } from '../use-cases/loop-engine.js';

export class LoopCommand implements Command {
  private engine: LoopEngine;

  constructor(
    taskRepository: TaskRepository,
    gitRepository: GitRepository,
    fileSystem: FileSystem,
    reviewer: Reviewer,
    driftChecker?: DriftChecker
  ) {
    this.engine = new LoopEngine(taskRepository, gitRepository, fileSystem, reviewer, driftChecker);
  }

  async execute(args: string[]): Promise<number> {
    const options: LoopOptions = {
      dryRun: args.includes('--dry-run'),
      resume: args.includes('--resume'),
      sprint: this.parseSprint(args),
      verbose: args.includes('--verbose'),
      quiet: args.includes('--quiet'),
    };
    await this.engine.execute(options);
    return 0;
  }

  private parseSprint(args: string[]): string | undefined {
    const i = args.indexOf('--sprint');
    return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
  }
}
