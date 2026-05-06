import { SelectNextTask, MuriConfig } from '../use-cases/select-next-task.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';

export class NextCommand {
  private useCase: SelectNextTask;

  constructor(private taskRepository: TaskRepository, private args: string[] = [], muriConfig?: MuriConfig) {
    this.useCase = new SelectNextTask(taskRepository, muriConfig);
  }

  async execute(): Promise<void> {
    const result = await this.useCase.execute();

    if (!result.ok) {
      const { halt } = result;
      let reason: string;
      if (halt.kind === 'no_ready_tasks') {
        reason = 'No READY tasks available.';
      } else if (halt.kind === 'stale_lock') {
        reason = `Stale lock: ${halt.taskId} has been IN_PROGRESS since ${halt.lockedAt} (> 3 days). Resolve before proceeding.`;
      } else if (halt.kind === 'budget_exceeded') {
        reason = `HALT: ${halt.taskId} has exceeded its ${halt.type} budget (${halt.current} > ${halt.limit}). Escalate before continuing.`;
      } else {
        reason = `Highest-priority READY task ${halt.taskId} is blocked by unresolved dependencies: ${halt.blockedBy.join(', ')}.`;
      }
      process.stderr.write(reason + '\n');
      process.exit(1);
    }

    const task = result.task;

    if (this.args.includes('--json')) {
      console.log(JSON.stringify({ taskId: task.id, filePath: task.filePath, content: task.content }));
    } else {
      console.log(task.content);
    }
  }
}
