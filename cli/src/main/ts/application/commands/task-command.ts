import { MarkTaskInProgress } from '../use-cases/mark-task-in-progress.js';
import { MarkTaskDone } from '../use-cases/mark-task-done.js';
import { RejectTask } from '../use-cases/task-reject.js';
import { RejectStaleTask } from '../use-cases/task-reject-stale.js';
import { UpdateTaskMetrics } from '../use-cases/update-task-metrics.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class TaskCommand {
  private markInProgress: MarkTaskInProgress;
  private markDone: MarkTaskDone;
  private rejectTask: RejectTask;
  private rejectStaleTask: RejectStaleTask;
  private updateMetrics: UpdateTaskMetrics;

  constructor(taskRepository: TaskRepository, reviewer: Reviewer) {
    this.markInProgress = new MarkTaskInProgress(taskRepository);
    this.markDone = new MarkTaskDone(taskRepository, reviewer);
    this.rejectTask = new RejectTask(taskRepository);
    this.rejectStaleTask = new RejectStaleTask(taskRepository);
    this.updateMetrics = new UpdateTaskMetrics(taskRepository);
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
    } else if (subCommand === 'metrics' && taskId) {
      const costIdx = args.indexOf('--cost');
      const stepsIdx = args.indexOf('--steps');
      const addCostIdx = args.indexOf('--add-cost');
      const addStepsIdx = args.indexOf('--add-steps');

      const options: any = {};
      if (costIdx !== -1) options.cost = parseFloat(args[costIdx + 1]);
      if (stepsIdx !== -1) options.steps = parseInt(args[stepsIdx + 1], 10);
      if (addCostIdx !== -1) options.addCost = parseFloat(args[addCostIdx + 1]);
      if (addStepsIdx !== -1) options.addSteps = parseInt(args[addStepsIdx + 1], 10);

      try {
        await this.updateMetrics.execute(taskId, options);
        fmt.arrow(`updated metrics for ${taskId}`);
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
      console.log('Usage: arch task [start|done|reject|reject-stale|metrics] [TASK-ID] [--force] [--reason "<text>"] [--cost <val>] [--steps <val>] [--add-cost <val>] [--add-steps <val>]');
    }
  }
}
