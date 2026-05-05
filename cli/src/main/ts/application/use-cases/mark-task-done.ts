import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus } from '../../domain/models/task.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import { FileSystem } from '../../domain/repositories/file-system.js';

export class MarkTaskDone {
  constructor(
    private taskRepository: TaskRepository,
    private reviewer: Reviewer,
    private fileSystem: FileSystem,
  ) {}

  async execute(taskId: string, force = false) {
    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (!force) {
      const reviewResult = this.reviewer.reviewTask({ ...task, status: TaskStatus.DONE }, task.rawMetaLine);
      if (!reviewResult.valid) {
        throw new Error(`Cannot mark ${taskId} as DONE due to violations:\n- ${reviewResult.violations.join('\n- ')}`);
      }

      const hanseiRequirement = await this.validateHanseiRequirement(task.id, task.content);
      if (hanseiRequirement) {
        throw new Error(`Cannot mark ${taskId} as DONE:\n- ${hanseiRequirement}`);
      }
    }

    task.status = TaskStatus.DONE;
    task.focus = false;
    if (!task.closedAt) {
      task.closedAt = new Date().toISOString();
    }
    await this.taskRepository.save(task);
    return task;
  }

  private async validateHanseiRequirement(taskId: string, content: string): Promise<string | null> {
    const configRaw = await this.fileSystem.readFile('arch.config.json');
    const config = JSON.parse(configRaw);
    const hanseiSinceTaskId = config.hanseiSinceTaskId as number | undefined;
    const taskNumber = parseInt(taskId.replace('TASK-', ''), 10);

    if (hanseiSinceTaskId === undefined || Number.isNaN(taskNumber) || taskNumber < hanseiSinceTaskId) {
      return null;
    }

    if (!content.includes('## Hansei')) {
      return `missing ## Hansei section for post-rollout task (TASK-${hanseiSinceTaskId}+).`;
    }

    return null;
  }
}
