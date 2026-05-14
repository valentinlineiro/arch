import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskValidator } from '../../domain/services/task-validator.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import path from 'node:path';

export class LintCommand {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem
  ) {}

  async execute(args: string[]): Promise<void> {
    const tasksDir = 'docs/tasks';
    let mdFiles: string[] = [];

    if (args.length > 0) {
      mdFiles = args.filter(f => f.endsWith('.md'));
    } else {
      if (!(await this.fileSystem.exists(tasksDir))) {
        fmt.fail(`Directory not found: ${tasksDir}`);
        process.exit(1);
      }
      const files = await this.fileSystem.readDirectory(tasksDir);
      mdFiles = files.filter(f => f.endsWith('.md')).map(f => path.join(tasksDir, f));
    }
    
    let failureCount = 0;
    
    fmt.header('Linting Tasks');

    for (const filePath of mdFiles) {
      if (!(await this.fileSystem.exists(filePath))) {
        fmt.warn(`File not found: ${filePath}`);
        continue;
      }
      const content = await this.fileSystem.readFile(filePath);
      const task = this.taskRepository.parseTask(content);

      if (!task) {
        fmt.fail(`${filePath}:`);
        console.log('    - Could not parse task header or meta line');
        failureCount++;
        continue;
      }

      let fileOk = true;
      const errors: string[] = [];

      const metaErrors = TaskValidator.validateMeta(task.rawMetaLine || '');
      if (metaErrors.length > 0) {
        errors.push(...metaErrors);
        fileOk = false;
      }

      if (task.rawDependsLine && !TaskValidator.isValidDepends(task.rawDependsLine)) {
        errors.push('Invalid Depends line');
        fileOk = false;
      }

      const hanseiErrors = TaskValidator.validateHansei(task);
      if (hanseiErrors.length > 0) {
        errors.push(...hanseiErrors);
        fileOk = false;
      }

      if (!fileOk) {
        fmt.fail(`${filePath}:`);
        errors.forEach(err => console.log(`    - ${err}`));
        failureCount++;
      }
    }

    if (failureCount > 0) {
      fmt.fail(`Lint failed with ${failureCount} violations.`);
      process.exit(1);
    } else {
      fmt.ok('All tasks follow canonical format.');
    }
  }
}
