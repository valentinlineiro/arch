import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus, FocusLevel } from '../../domain/models/task.js';
import { ValidateTaskAcs } from './validate-task-acs.js';
import { TaskValidator } from '../../domain/services/task-validator.js';

export class MarkTaskReview {
  private validateAcs: ValidateTaskAcs;

  constructor(private taskRepository: TaskRepository, rootPath: string) {
    this.validateAcs = new ValidateTaskAcs(rootPath);
  }

  async execute(taskId: string): Promise<{ passed: boolean; failures: string[] }> {
    const task = await this.taskRepository.getById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new Error(`Task ${taskId} is not in IN_PROGRESS state`);
    }

    const validation = this.validateAcs.execute(task.content, taskId);

    if (!validation.allPassed) {
      const failures = validation.results
        .filter(r => !r.passed)
        .map(r => {
          if (r.type === 'cmd') {
            return `[exit ${r.actualExit}, expected ${r.expectedExit}] ${r.ac} (cmd: ${r.command})`;
          }
          return `${r.ac}: ${r.reason || 'failed'}`;
        });
      return { passed: false, failures };
    }

    const hanseiErrors = TaskValidator.validateHansei({ ...task, status: TaskStatus.REVIEW });
    if (hanseiErrors.length > 0) {
      return { passed: false, failures: hanseiErrors };
    }

    task.status = TaskStatus.REVIEW;
    task.focus = FocusLevel.NONE;
    await this.taskRepository.save(task);
    return { passed: true, failures: [] };
  }
}
