import { TaskRepository } from '../repositories/task-repository.js';
import { GitRepository } from '../repositories/git-repository.js';
import { TaskStatus } from '../models/task.js';

export class HumanCoordinationService {
  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository
  ) {}

  async approveTask(taskId: string): Promise<void> {
    const task = await this.taskRepository.getById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    if (task.status === TaskStatus.REVIEW) {
      task.status = TaskStatus.DONE;
    } else if (task.status === TaskStatus.IDEA) {
      task.status = TaskStatus.READY;
    } else {
      throw new Error(`Task ${taskId} is in status ${task.status} and cannot be approved.`);
    }

    await this.taskRepository.save(task);
    await this.gitRepository.add(task.filePath);
    await this.gitRepository.commit(`chore: human approval for ${taskId} [${taskId}]`);
  }

  async redirectTask(taskId: string, instruction: string): Promise<void> {
    const task = await this.taskRepository.getById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const date = new Date().toISOString().split('T')[0];
    const communication = `\n\n## Communication\n- **Human [${date}]:** ${instruction}\n`;

    // Append to task file content
    task.content += communication;
    
    // If it was in REVIEW, move it back to IN_PROGRESS or READY depending on focus
    if (task.status === TaskStatus.REVIEW) {
      task.status = TaskStatus.IN_PROGRESS;
    }

    await this.taskRepository.save(task);
    await this.gitRepository.add(task.filePath);
    await this.gitRepository.commit(`chore: human redirection for ${taskId} [${taskId}]`);
  }
}
