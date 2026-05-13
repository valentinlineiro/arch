import { MarkTaskInProgress } from '../use-cases/mark-task-in-progress.js';
import { MarkTaskDone } from '../use-cases/mark-task-done.js';
import { MarkTaskReview } from '../use-cases/mark-task-review.js';
import { RejectTask } from '../use-cases/task-reject.js';
import { RejectStaleTask } from '../use-cases/task-reject-stale.js';
import { UpdateTaskMetrics } from '../use-cases/update-task-metrics.js';
import { ContextInference } from '../use-cases/context-inference.js';
import { CompressTask } from '../use-cases/compress-task.js';
import { NextCommand } from './next-command.js';
import { RankCommand } from './rank-command.js';
import { PromoteCommand } from './promote-command.js';
import { HumanCoordinationService } from '../../domain/services/human-coordination-service.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import { EventRepository } from '../../domain/models/event.js';
import { NodeFeedbackRepository } from '../../infrastructure/filesystem/node-feedback-repository.js';
import { CausalSignalLog } from '../use-cases/causal-signal-log.js';
import { EventLogger } from '../../domain/services/event-logger.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class TaskCommand {
  private markInProgress: MarkTaskInProgress;
  private markDone: MarkTaskDone;
  private markReview: MarkTaskReview;
  private rejectTask: RejectTask;
  private rejectStaleTask: RejectStaleTask;
  private updateMetrics: UpdateTaskMetrics;
  private taskRepository: TaskRepository;
  private gitRepository: GitRepository;
  private muriConfig: any;

  constructor(
    taskRepository: TaskRepository,
    reviewer: Reviewer,
    private humanCoordinationService: HumanCoordinationService,
    private fileSystem: FileSystem,
    rootPath: string,
    eventRepository?: EventRepository,
    causalSignalLog?: CausalSignalLog,
    gitRepository?: GitRepository,
    muriConfig?: any,
    eventLogger?: EventLogger
  ) {
    this.taskRepository = taskRepository;
    this.gitRepository = gitRepository!;
    this.muriConfig = muriConfig;
    this.markInProgress = new MarkTaskInProgress(taskRepository, eventRepository);
    this.markDone = new MarkTaskDone(taskRepository, reviewer, fileSystem, eventRepository, new NodeFeedbackRepository(fileSystem), causalSignalLog, eventLogger);
    this.markReview = new MarkTaskReview(taskRepository, rootPath);
    this.rejectTask = new RejectTask(taskRepository, eventLogger);
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
        const task = await this.markInProgress.execute(taskId, 'cli');
        fmt.arrow(`marking ${taskId} as IN_PROGRESS`);

        try {
          const taskText = `${task.title} ${task.content}`;
          const inference = new ContextInference(this.fileSystem);
          await inference.execute(taskId, taskText, task.class ?? '');
        } catch { /* inference errors must never block task start */ }
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
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
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'review' && taskId) {
      try {
        const result = await this.markReview.execute(taskId);
        if (result.passed) {
          fmt.check(`${taskId} predicates passed — status set to REVIEW`);
        } else {
          fmt.fail(`${taskId} has failing cmd: predicates:`);
          result.failures.forEach(f => console.log(`    - ${f}`));
          process.exit(1);
        }
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'done' && taskId) {
      try {
        await this.markDone.execute(taskId, force);
        fmt.check(`marking ${taskId} as DONE`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'reject' && taskId) {
      try {
        await this.rejectTask.execute(taskId, reason);
        fmt.arrow(`rejected ${taskId} — moved back to READY`);
        if (reason) console.log(`    Reason: ${reason}`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'reject-stale' && taskId) {
      try {
        await this.rejectStaleTask.execute(taskId);
        fmt.arrow(`rejected ${taskId} — archived as stale`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'approve' && taskId) {
      try {
        await this.humanCoordinationService.approveTask(taskId);
        fmt.check(`approved ${taskId}`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'redirect' && taskId) {
      try {
        const toIdx = args.indexOf('--to');
        const instruction = toIdx !== -1 ? args.slice(toIdx + 1).join(' ') : '';
        if (!instruction) throw new Error('Missing instruction after --to');
        
        await this.humanCoordinationService.redirectTask(taskId, instruction);
        fmt.check(`redirected ${taskId} with new instruction`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'next') {
      await new NextCommand(this.taskRepository, args.slice(1), this.muriConfig).execute();
    } else if (subCommand === 'rank') {
      await new RankCommand(this.taskRepository).execute();
    } else if (subCommand === 'promote') {
      await new PromoteCommand(this.taskRepository, this.gitRepository, this.fileSystem).execute(args.slice(1));
    } else if (subCommand === 'compress') {
      const compressor = new CompressTask(this.fileSystem, process.cwd());
      const all = args.includes('--all');
      try {
        if (all) {
          const ids = await compressor.executeAll();
          fmt.check(`compressed ${ids.length} archive files`);
        } else if (taskId) {
          await compressor.execute(taskId);
          fmt.check(`compressed ${taskId}`);
        } else {
          fmt.fail('Usage: arch task compress TASK-XXX | arch task compress --all');
          process.exit(1);
        }
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === '--help' || subCommand === 'help' || !subCommand) {
      console.log([
        'Usage: arch task <subcommand> [args]',
        '',
        'Subcommands:',
        '  start TASK-XXX          Mark a task as IN_PROGRESS',
        '  review TASK-XXX         Run cmd: predicates and set status to REVIEW',
        '  done TASK-XXX           Archive a task as DONE',
        '  reject TASK-XXX         Move a task back to READY',
        '  reject-stale TASK-XXX   Archive a stale task',
        '  approve TASK-XXX        Human approval gate',
        '  redirect TASK-XXX --to  Redirect with new instruction',
        '  metrics TASK-XXX        Update cost/step metrics',
        '  compress [TASK-XXX|--all]  Lossy-compress archive files',
        '  next                    Suggest next highest-priority task',
        '  rank                    Rank READY tasks by priority and size',
        '  promote <idea-slug>     Promote an IDEA to a TASK',
      ].join('\n'));
    } else {
      fmt.fail(`Unknown subcommand: ${subCommand}. Run 'arch task --help' for usage.`);
      process.exit(1);
    }
  }
}
