import { ValidateSystem } from '../use-cases/validate-system.js';
import { ValidateTaskAcs } from '../use-cases/validate-task-acs.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class ValidateCommand {
  private useCase: ValidateSystem;

  constructor(
    private taskRepository: TaskRepository,
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

    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      fmt.fail(`Task file not found: docs/tasks/${taskId}.md`);
      process.exit(1);
    }

    const validator = new ValidateTaskAcs(this.rootPath);
    const result = validator.execute(task.content, taskId);

    if (result.results.length === 0) {
      fmt.ok(`${taskId}: no ACs found`);
      process.exit(0);
    }

    let anyFailed = false;
    for (const r of result.results) {
      if (r.timedOut) {
        fmt.fail(`FAIL  ${r.ac} (TIMEOUT after 30s)`);
        console.log(`      cmd: ${r.command}`);
        anyFailed = true;
      } else if (r.passed) {
        if (r.type === 'prose') {
          fmt.arrow(`SKIP  ${r.ac} (prose: marker detected)`);
        } else {
          fmt.check(`PASS  ${r.ac}`);
        }
      } else {
        if (r.type === 'cmd') {
          fmt.fail(`FAIL  ${r.ac} (exit ${r.actualExit}, expected ${r.expectedExit})`);
          console.log(`      cmd: ${r.command}`);
        } else if (r.type === 'missing') {
          fmt.warn(`WARN  ${r.ac} (missing predicate or prose: marker)`);
        } else {
          fmt.fail(`FAIL  ${r.ac} (${r.reason || 'failed'})`);
          if (r.command) console.log(`      ${r.command}`);
        }
        anyFailed = true;
      }
    }

    process.exit(anyFailed ? 1 : 0);
  }
}
