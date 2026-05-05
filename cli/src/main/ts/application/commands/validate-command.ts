import { ValidateSystem } from '../use-cases/validate-system.js';
import { ValidateTaskAcs } from '../use-cases/validate-task-acs.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class ValidateCommand {
  private useCase: ValidateSystem;

  constructor(
    taskRepository: TaskRepository,
    fileSystem: FileSystem,
    private rootPath: string,
  ) {
    this.useCase = new ValidateSystem(taskRepository, fileSystem);
  }

  async execute(args: string[] = []): Promise<void> {
    const acsIdx = args.indexOf('--acs');
    if (acsIdx !== -1) {
      await this.executeAcs(args[acsIdx + 1]);
      return;
    }

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

  private async executeAcs(taskId: string | undefined): Promise<void> {
    if (!taskId) {
      fmt.fail('Usage: arch validate --acs TASK-XXX');
      process.exit(1);
    }

    const validator = new ValidateTaskAcs(this.rootPath);
    const taskPath = `${this.rootPath}/docs/tasks/${taskId}.md`;

    let content: string;
    try {
      const fs = await import('node:fs/promises');
      content = await fs.readFile(taskPath, 'utf8');
    } catch {
      fmt.fail(`Task file not found: docs/tasks/${taskId}.md`);
      process.exit(1);
    }

    const result = validator.execute(content, taskId);

    if (result.results.length === 0) {
      fmt.ok(`${taskId}: no cmd: predicates found`);
      process.exit(0);
    }

    let anyFailed = false;
    for (const r of result.results) {
      if (r.passed) {
        fmt.check(`PASS  ${r.ac}`);
      } else {
        fmt.fail(`FAIL  ${r.ac}  (exit ${r.actualExit}, expected ${r.expectedExit})`);
        console.log(`      cmd: ${r.command}`);
        anyFailed = true;
      }
    }

    process.exit(anyFailed ? 1 : 0);
  }
}
