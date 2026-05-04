import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class MoveArtifact {
  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem
  ) {}

  async execute(source: string, destination: string): Promise<void> {
    if (!source || !destination) {
      throw new Error('Usage: arch mv <source> <destination>');
    }

    if (!(await this.fileSystem.exists(source))) {
      throw new Error(`Source path does not exist: ${source}`);
    }

    // 1. Git move
    await this.gitRepository.mv(source, destination);
    fmt.check(`Moved ${source} to ${destination}`);

    // 2. Update task context
    const tasks = await this.taskRepository.getActive();
    let updatedCount = 0;

    for (const task of tasks) {
      let changed = false;
      const newContext = task.context.map(ctx => {
        if (ctx === source) {
          changed = true;
          return destination;
        }
        if (ctx.startsWith(source + '/')) {
          changed = true;
          return ctx.replace(source, destination);
        }
        return ctx;
      });

      if (changed) {
        task.context = newContext;
        await this.taskRepository.save(task);
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      fmt.check(`Updated context in ${updatedCount} tasks.`);
      await this.gitRepository.commit(`chore: update task context after move ${source} -> ${destination} [TASK-168]`);
    } else {
      fmt.info('No tasks required context updates.');
    }
  }
}
