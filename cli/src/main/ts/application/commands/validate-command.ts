import { Command } from '../../domain/models/command.js';
import { ValidateSystem } from '../use-cases/validate-system.js';
import { ValidateTaskAcs } from '../use-cases/validate-task-acs.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

export class ValidateCommand implements Command {
  private useCase: ValidateSystem;

  constructor(
    private taskRepository: TaskRepository,
    fileSystem: FileSystem,
    private rootPath: string,
  ) {
    this.useCase = new ValidateSystem(taskRepository, fileSystem);
  }

  async execute(args: string[] = []): Promise<number> {
    const acsIdx = args.indexOf('--acs');
    if (acsIdx !== -1) {
      await this.executeAcs(args[acsIdx + 1]);
      return 0;
    }

    const result = await this.useCase.execute();
    if (result.success) {
      fmt.ok('System Validation: OK\n');
      return 0;
    } else {
      fmt.fail('System Validation: FAILED');
      result.errors.forEach(err => fmt.log(`    - ${err}`));
      fmt.log('');
      return 1;
    }
    return 0;
  }

  private async executeAcs(taskId: string | undefined): Promise<number> {
    if (!taskId) {
      fmt.fail('Usage: arch validate --acs TASK-XXX');
      return 1;
    }

    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      fmt.fail(`Task file not found: ${PathResolver.from({}).tasks}/${taskId}.md`);
      return 1;
    }

    const validator = new ValidateTaskAcs(this.rootPath);
    const result = validator.execute(task.content, taskId);

    if (result.results.length === 0) {
      fmt.ok(`${taskId}: no ACs found`);
      return 0;
    }

    let anyFailed = false;
    for (const r of result.results) {
      if (r.timedOut) {
        fmt.fail(`FAIL  ${r.ac} (TIMEOUT after 30s)`);
        fmt.log(`      cmd: ${r.command}`);
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
          fmt.log(`      cmd: ${r.command}`);
        } else if (r.type === 'missing') {
          fmt.warn(`WARN  ${r.ac} (missing predicate or prose: marker)`);
        } else {
          fmt.fail(`FAIL  ${r.ac} (${r.reason || 'failed'})`);
          if (r.command) fmt.log(`      ${r.command}`);
        }
        anyFailed = true;
      }
    }

    return anyFailed ? 1 : 0;
  }
}
