import { Command } from '../../domain/models/command.js';
import readline from 'node:readline/promises';
import { PromoteIdea } from '../use-cases/promote-idea.js';
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class PromoteCommand implements Command {
  private promoteIdea: PromoteIdea;

  constructor(
    taskRepository: TaskRepository,
    gitRepository: GitRepository,
    fileSystem: FileSystem
  ) {
    this.promoteIdea = new PromoteIdea(taskRepository, gitRepository, fileSystem);
  }

  async execute(args: string[]): Promise<number> {
    const ideaSlug = args[0];
    if (!ideaSlug) {
      fmt.log('Usage: arch promote [IDEA-slug] [--yes]');
      return 0;
    }

    const force = args.includes('--yes') || args.includes('-y');

    if (!force) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      try {
        const answer = await rl.question(`Confirm promotion of ${ideaSlug}? (y/N): `);
        if (answer.toLowerCase() !== 'y') {
          fmt.warn('Promotion cancelled.');
          return 0;
        }
      } finally {
        rl.close();
      }
    }

    try {
      fmt.arrow(`Promoting ${ideaSlug}...`);
      const taskId = await this.promoteIdea.execute(ideaSlug);
      fmt.check(`Successfully promoted ${ideaSlug} to ${taskId}`);
    } catch (error: any) {
      fmt.warn(error.message);
    }
    return 0;
  }
}
