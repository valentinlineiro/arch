import { MarkTaskInProgress } from '../use-cases/mark-task-in-progress.js';
import { MarkTaskDone } from '../use-cases/mark-task-done.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class TaskCommand {
  private markInProgress: MarkTaskInProgress;
  private markDone: MarkTaskDone;

  constructor(taskRepository: TaskRepository) {
    this.markInProgress = new MarkTaskInProgress(taskRepository);
    this.markDone = new MarkTaskDone(taskRepository);
  }

  async execute(subCommand: string, taskId: string): Promise<void> {
    if (subCommand === 'start' && taskId) {
      try {
        await this.markInProgress.execute(taskId, 'cli');
        fmt.arrow(`marking ${taskId} as IN_PROGRESS`);
      } catch (error: any) {
        fmt.warn(error.message);
      }
    } else if (subCommand === 'done' && taskId) {
      try {
        await this.markDone.execute(taskId);
        fmt.check(`marking ${taskId} as DONE`);
      } catch (error: any) {
        fmt.warn(error.message);
      }
    } else {
      console.log('Usage: arch task [start|done] [TASK-ID]');
    }
  }
}
