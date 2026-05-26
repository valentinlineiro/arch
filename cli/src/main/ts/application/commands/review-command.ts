import { CommandExit, Command } from '../../domain/models/command.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { DeterministicACVerifier } from '../../domain/services/deterministic-ac-verifier.js';
import { TaskStatus } from '../../domain/models/task.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';
import readline from 'node:readline';

export class ReviewCommand implements Command {
  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem,
  ) {}

  async execute(args: string[] = []): Promise<number> {
    if (args.includes('--help') || args.includes('-h')) {
      this.showHelp();
      return 0;
    }

    const tasks = await this.taskRepository.getAll();
    const reviewTasks = tasks.filter(t => t.status === TaskStatus.REVIEW);

    if (reviewTasks.length === 0) {
      fmt.check('No REVIEW-status tasks found');
      return 0;
    }

    fmt.header(`Review Queue — ${reviewTasks.length} task(s)`);
    console.log('');

    const verifier = new DeterministicACVerifier();
    for (const task of reviewTasks) {
      const acResult = await verifier.verify(task);
      const acPassed = acResult.evidence.filter(e => e.pass).length;
      const acTotal = acResult.evidence.length;

      console.log(`  \x1b[1m${task.id}: ${task.title}\x1b[0m`);
      console.log(`  ${'─'.repeat(50)}`);
      for (const ev of acResult.evidence) {
        const icon = ev.pass ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✖\x1b[0m';
        console.log(`  ${icon} ${ev.ac.slice(0, 72)}`);
        if (!ev.pass) {
          console.log(`     ${ev.detail.split('\n')[0].slice(0, 70)}`);
        }
      }
      console.log(`  \x1b[90mACs: ${acPassed}/${acTotal} passed\x1b[0m`);

      // Diff summary
      try {
        const diffOutput = await this.gitRepository.getDiff(['--', task.filePath]);
        if (diffOutput && diffOutput.length > 0) {
          const added = (diffOutput.match(/^\+/gm) || []).length;
          const removed = (diffOutput.match(/^-/gm) || []).length;
          console.log(`  \x1b[90mDiff: +${added}/-${removed} lines\x1b[0m`);
        }
      } catch { /* non-blocking */ }

      // Prompt
      const answer = await this.prompt(`  \x1b[33mAccept? [y/N/edit]:\x1b[0m `);
      if (answer === 'y' || answer === 'Y') {
        await this.markTaskDone(task.id);
        fmt.ok(`${task.id} marked as DONE`);
      } else if (answer === 'edit' || answer === 'e') {
        fmt.info(`${task.id} — edit manually and re-run arch review`);
      } else {
        fmt.info(`${task.id} skipped`);
      }
      console.log('');
    }
    return 0;
  }

  private async markTaskDone(taskId: string): Promise<void> {
    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      fmt.fail(`Task ${taskId} not found`);
      return;
    }
    task.status = TaskStatus.DONE;
    task.focus = false as any;
    if (!task.closedAt) {
      task.closedAt = new Date().toISOString();
    }
    await this.taskRepository.save(task);
  }

  private prompt(question: string): Promise<string> {
    if (!process.stdin.isTTY) {
      return Promise.resolve('n');
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
      rl.question(question, answer => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  private showHelp(): void {
    console.log('');
    console.log('  Usage: arch review [options]');
    console.log('');
    console.log('  Lists all REVIEW-status tasks with AC verification and diff summary.');
    console.log('  Prompts [y/N/edit] per task.');
    console.log('');
    console.log('  Options:');
    console.log('    --help, -h    Show this help');
    console.log('');
  }
}
