import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskValidator } from '../../domain/services/task-validator.js';
import { FileSystem } from '../../domain/repositories/file-system.js';

export interface ValidationResult {
  success: boolean;
  errors: string[];
}

export class ValidateSystem {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem
  ) {}

  async execute(): Promise<ValidationResult> {
    const errors: string[] = [];

    // 1. Validate arch.config.json if it exists
    const configPath = 'arch.config.json';
    if (await this.fileSystem.exists(configPath)) {
      try {
        const configContent = await this.fileSystem.readFile(configPath);
        const config = JSON.parse(configContent);
        this.validateConfig(config, errors);
      } catch (e) {
        errors.push(`[arch.config.json] is not valid JSON: ${(e as Error).message}`);
      }
    }

    // 2. Validate tasks in modular structure
    const tasks = await this.taskRepository.getAll();
    for (const task of tasks) {
      if (task.rawMetaLine && !TaskValidator.isValidMeta(task.rawMetaLine)) {
        const subDir = task.sprint.startsWith('Sprint') ? 'sprint' : 'backlog';
        errors.push(`[docs/tasks/${subDir}/${task.id}.md] Task ${task.id} has an invalid Meta line: ${task.rawMetaLine}`);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  private validateConfig(config: any, errors: string[]) {
    if (typeof config !== 'object' || config === null) {
      errors.push('[arch.config.json] must be an object');
      return;
    }

    const requiredFields = ['version'];
    for (const field of requiredFields) {
      if (!(field in config)) {
        errors.push(`[arch.config.json] missing required field: ${field}`);
      }
    }
  }
}
