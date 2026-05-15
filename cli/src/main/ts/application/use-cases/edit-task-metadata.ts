import readline from 'node:readline/promises';
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { GitRepository } from '../../domain/repositories/git-repository.js';
import { TaskValidator } from '../../domain/services/task-validator.js';
import { TaskStatus } from '../../domain/models/task.js';

const VALID_PRIORITIES = ['P0', 'P1', 'P2', 'P3'];
const VALID_SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const EDITABLE_STATUSES: string[] = [TaskStatus.READY, TaskStatus.BLOCKED];

export class EditTaskMetadata {
  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository
  ) {}

  async execute(taskId: string): Promise<void> {
    const task = await this.taskRepository.getById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    try {
      const ask = async (label: string, current: string, valid?: string[]): Promise<string> => {
        const hint = valid ? ` (${valid.join('|')})` : '';
        const answer = await rl.question(`  ${label}${hint} [${current}]: `);
        return answer.trim() || current;
      };

      console.log(`\nEditing ${taskId}: ${task.title}\n`);

      task.priority = await ask('Priority', task.priority, VALID_PRIORITIES);
      task.size = await ask('Size', task.size, VALID_SIZES);

      if (EDITABLE_STATUSES.includes(task.status)) {
        const newStatus = await ask('Status', task.status, EDITABLE_STATUSES);
        task.status = newStatus as TaskStatus;
      }

      task.class = await ask('Class', task.class);
      const rawContext = await ask('Context', task.context.join(', '));
      task.context = rawContext.split(',').map(s => s.trim()).filter(Boolean);
    } finally {
      rl.close();
    }

    const newMetaLine = `**Meta:** ${task.priority} | ${task.size} | ${task.status} | Focus:${task.focus ? 'yes' : 'no'} | ${task.class} | ${task.cli} | ${task.context.join(', ')}`;
    const errors = TaskValidator.validateMeta(newMetaLine);
    if (errors.length > 0) {
      throw new Error(`Validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }

    await this.taskRepository.save(task);
    await this.gitRepository.add(task.filePath);
    await this.gitRepository.commit(`chore: [${taskId}] update metadata`);
  }
}
