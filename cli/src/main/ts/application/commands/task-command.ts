import { MarkTaskInProgress } from '../use-cases/mark-task-in-progress.js';
import { MarkTaskDone } from '../use-cases/mark-task-done.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class TaskCommand {
  private markInProgress: MarkTaskInProgress;
  private markDone: MarkTaskDone;

  constructor(taskRepository: TaskRepository, reviewer: Reviewer) {
    this.markInProgress = new MarkTaskInProgress(taskRepository);
    this.markDone = new MarkTaskDone(taskRepository, reviewer);
  }

  async execute(args: string[]): Promise<void> {
    const subCommand = args[0];
    const taskId = args.find(arg => arg.startsWith('TASK-'));
    const force = args.includes('--force');

    if (subCommand === 'start' && taskId) {
      try {
        await this.markInProgress.execute(taskId, 'cli');
        fmt.arrow(`marking ${taskId} as IN_PROGRESS`);
      } catch (error: any) {
        fmt.warn(error.message);
      }
    } else if (subCommand === 'done' && taskId) {
      try {
        await this.markDone.execute(taskId, force);
        fmt.check(`marking ${taskId} as DONE`);
      } catch (error: any) {
        fmt.warn(error.message);
      }
    } else {
      console.log('Usage: arch task [start|done] [TASK-ID] [--force]');
    }
  }
}
