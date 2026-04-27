import { ValidateSystem } from '../use-cases/validate-system.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class ValidateCommand {
  private useCase: ValidateSystem;

  constructor(taskRepository: TaskRepository, fileSystem: FileSystem) {
    this.useCase = new ValidateSystem(taskRepository, fileSystem);
  }

  async execute(): Promise<void> {
    const result = await this.useCase.execute();
    if (result.success) {
      fmt.ok('System Validation: OK\n');
      process.exit(0);
    } else {
      fmt.fail('System Validation: FAILED');
      result.errors.forEach(err => console.log(`    - ${err}`));
      console.log('');
      process.exit(1);
    }
  }
}
