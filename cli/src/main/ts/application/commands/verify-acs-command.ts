import { Command } from '../../domain/models/command.js';
import { DeterministicACVerifier } from '../../domain/services/deterministic-ac-verifier.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class VerifyAcsCommand implements Command {
  constructor(
    private taskRepository: TaskRepository,
    private rootPath: string,
  ) {}

  async execute(args: string[]): Promise<void> {
    const taskId = args.find(a => /^TASK-\d+$/.test(a));
    if (!taskId) {
      fmt.fail('Usage: arch verify-acs TASK-XXX');
      process.exit(1);
    }

    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      fmt.fail(`Task ${taskId} not found`);
      process.exit(1);
    }

    fmt.header(`AC Verification — ${taskId}`);
    console.log('');

    const verifier = new DeterministicACVerifier(this.rootPath);
    const result = await verifier.verify(task);

    for (const ev of result.evidence) {
      const icon = ev.pass ? '  \x1b[32m✔\x1b[0m' : '  \x1b[31m✖\x1b[0m';
      const typeTag = `[${ev.type}]`.padEnd(10);
      console.log(`${icon} ${typeTag} ${ev.ac}`);
      if (!ev.pass || ev.type === 'prose' || ev.type === 'code') {
        console.log(`       ${ev.detail.replace(/\n/g, '\n       ')}`);
      }
    }

    console.log('');
    if (result.pass) {
      console.log('  \x1b[32m✔\x1b[0m All ACs passed.');
    } else {
      const failed = result.evidence.filter(e => !e.pass).length;
      console.error(`  \x1b[31m✖\x1b[0m ${failed} AC(s) failed.`);
      process.exit(1);
    }
  }
}
