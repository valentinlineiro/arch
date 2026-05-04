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
      const lines = content.split('\n');
      
      const headerLine = lines.find(l => l.startsWith('## TASK-'));
      const metaLine = lines.find(l => l.startsWith('**Meta:**'));
      const dependsLine = lines.find(l => l.startsWith('**Depends:**'));

      let fileOk = true;
      const errors: string[] = [];

      if (!headerLine || !TaskValidator.isValidHeader(headerLine)) {
        errors.push('Invalid or missing Header (## TASK-XXX: Title)');
        fileOk = false;
      }

      if (!metaLine || !TaskValidator.isValidMeta(metaLine)) {
        errors.push('Invalid or missing Meta line');
        fileOk = false;
      }

      if (!dependsLine || !TaskValidator.isValidDepends(dependsLine)) {
        errors.push('Invalid or missing Depends line');
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
