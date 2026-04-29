import { MarkTaskInProgress } from '../use-cases/mark-task-in-progress.js';
import { MarkTaskDone } from '../use-cases/mark-task-done.js';
import { RejectTask } from '../use-cases/task-reject.js';
import { RejectStaleTask } from '../use-cases/task-reject-stale.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class TaskCommand {
  private markInProgress: MarkTaskInProgress;
  private markDone: MarkTaskDone;
  private rejectTask: RejectTask;
  private rejectStaleTask: RejectStaleTask;

  constructor(taskRepository: TaskRepository, reviewer: Reviewer) {
    this.markInProgress = new MarkTaskInProgress(taskRepository);
    this.markDone = new MarkTaskDone(taskRepository, reviewer);
    this.rejectTask = new RejectTask(taskRepository);
    this.rejectStaleTask = new RejectStaleTask(taskRepository);
  }

  async execute(args: string[]): Promise<void> {
    const subCommand = args[0];
    const taskId = args.find(arg => arg.startsWith('TASK-'));
    const force = args.includes('--force');
    const reasonIdx = args.indexOf('--reason');
    const reason = reasonIdx !== -1 ? args[reasonIdx + 1] : '';

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
    } else if (subCommand === 'reject' && taskId) {
      try {
        await this.rejectTask.execute(taskId, reason);
        fmt.arrow(`rejected ${taskId} — moved back to READY`);
        if (reason) console.log(`    Reason: ${reason}`);
      } catch (error: any) {
        fmt.warn(error.message);
      }
    } else if (subCommand === 'reject-stale' && taskId) {
      try {
        await this.rejectStaleTask.execute(taskId);
        fmt.arrow(`rejected ${taskId} — archived as stale`);
      } catch (error: any) {
        fmt.warn(error.message);
      }
    } else {
      console.log('Usage: arch task [start|done|reject|reject-stale] [TASK-ID] [--force] [--reason "<text>"]');
    }
  }
}
