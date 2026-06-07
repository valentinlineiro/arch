import { CommandExit, Command } from '../../domain/models/command.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { DeterministicACVerifier } from '../../domain/services/deterministic-ac-verifier.js';
import { TaskStatus } from '../../domain/models/task.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';
import readline from 'node:readline';
import { DriftChecker } from '../use-cases/drift-checker.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

export class ReviewCommand implements Command {
  private driftChecker: DriftChecker;
  constructor(
    private taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem,
    private rootPath: string = '.',
  ) {
    this.driftChecker = new DriftChecker(fileSystem, gitRepository, rootPath);
  }

  async execute(args: string[] = []): Promise<number> {
    if (args.includes('--help') || args.includes('-h')) {
      this.showHelp();
      return 0;
    }

    if (args.includes('--env')) {
      return await this.runEnvCheck();
    }

    const tasks = await this.taskRepository.getAll();
    const reviewTasks = tasks.filter(t => t.status === TaskStatus.REVIEW);

    if (reviewTasks.length === 0) {
      fmt.check('No REVIEW-status tasks found');
      return 0;
    }

    fmt.header(`Review Queue — ${reviewTasks.length} task(s)`);
    fmt.log('');

    const verifier = new DeterministicACVerifier();
    for (const task of reviewTasks) {
      const acResult = await verifier.verify(task);
      const acPassed = acResult.evidence.filter(e => e.pass).length;
      const acTotal = acResult.evidence.length;

      fmt.log(`  \x1b[1m${task.id}: ${task.title}\x1b[0m`);
      fmt.log(`  ${'─'.repeat(50)}`);
      for (const ev of acResult.evidence) {
        const icon = ev.pass ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✖\x1b[0m';
        fmt.log(`  ${icon} ${ev.ac.slice(0, 72)}`);
        if (!ev.pass) {
          fmt.log(`     ${ev.detail.split('\n')[0].slice(0, 70)}`);
        }
      }
      fmt.log(`  \x1b[90mACs: ${acPassed}/${acTotal} passed\x1b[0m`);

      // Diff summary
      try {
        const diffOutput = await this.gitRepository.getDiff(['--', task.filePath]);
        if (diffOutput && diffOutput.length > 0) {
          const added = (diffOutput.match(/^\+/gm) || []).length;
          const removed = (diffOutput.match(/^-/gm) || []).length;
          fmt.log(`  \x1b[90mDiff: +${added}/-${removed} lines\x1b[0m`);
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
      fmt.log('');
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
    fmt.log('');
    fmt.log('  Usage: arch review [options]');
    fmt.log('');
    fmt.log('  Lists all REVIEW-status tasks with AC verification and diff summary.');
    fmt.log('  Prompts [y/N/edit] per task.');
    fmt.log('');
    fmt.log('  Options:');
    fmt.log('    --help, -h    Show this help');
    fmt.log('    --env         Run environment pre-flight check');
    fmt.log('');
  }

  private async runEnvCheck(): Promise<number> {
    console.log('\n  \x1b[32mARCH\x1b[0m — Environment Pre-flight\n');
    const failures: string[] = [];

    // 1. Check no ANDON_HALT in NOTIFICATIONS.md
    try {
      const pr = PathResolver.from({});
      const notifications = await this.driftChecker.fileSystem?.readFile(pr.notifications ?? 'docs/NOTIFICATIONS.md').catch(() => '');
      if (notifications && notifications.includes('[ANDON_HALT]')) {
        failures.push('ANDON_HALT entry in NOTIFICATIONS.md — clear it before proceeding');
        console.log('  \x1b[31m✖\x1b[0m ANDON_HALT detected in NOTIFICATIONS.md');
      } else {
        console.log('  \x1b[32m✔\x1b[0m No ANDON_HALT');
      }
    } catch { /* no notifications file — OK */ }

    // 2. Check git clean (no merge conflicts)
    try {
      const { execSync } = await import('node:child_process');
      const status = execSync('git status --porcelain 2>/dev/null', { encoding: 'utf8', timeout: 5000, stdio: ['pipe','pipe','pipe'] }).trim();
      const conflicts = status.split('\n').filter(l => l.startsWith('UU') || l.startsWith('AA') || l.startsWith('DD'));
      if (conflicts.length > 0) {
        failures.push(`${conflicts.length} git merge conflict(s) — resolve before proceeding`);
        console.log(`  \x1b[31m✖\x1b[0m ${conflicts.length} merge conflict(s)`);
      } else {
        console.log('  \x1b[32m✔\x1b[0m Git clean (no merge conflicts)');
      }
    } catch { /* git not available */ }

    // 3. Run test suite
    try {
      const { execSync } = await import('node:child_process');
      const { existsSync } = await import('node:fs');
      // Find the right test directory
      const cwd = existsSync(`${process.cwd()}/cli/package.json`) ? `${process.cwd()}/cli` : process.cwd();
      execSync(`npm test 2>/dev/null`, { cwd, timeout: 120000, stdio: ['pipe','pipe','pipe'] });
      console.log('  \x1b[32m✔\x1b[0m Test suite passes');
    } catch {
      failures.push(`Test suite failing — fix tests before running autonomous tasks`);
      console.log('  \x1b[31m✖\x1b[0m Test suite failing');
    }

    // 4. Run arch review (drift check)
    const driftResults = await this.driftChecker.check();
    const blocking = driftResults.filter(r => r.status === 'FAIL' || r.status === 'ERROR');
    if (blocking.length > 0) {
      failures.push(`arch review has ${blocking.length} blocking violation(s) — run arch fix`);
      console.log(`  \x1b[31m✖\x1b[0m arch review: ${blocking.length} blocking violation(s)`);
    } else {
      console.log('  \x1b[32m✔\x1b[0m arch review passes');
    }

    console.log('');
    if (failures.length === 0) {
      console.log('  \x1b[32m✔\x1b[0m Environment ready. Safe to start autonomous tasks.\n');
      return 0;
    }

    console.log(`  \x1b[31m✖\x1b[0m ${failures.length} pre-flight failure(s):\n`);
    for (const f of failures) console.log(`    • ${f}`);
    console.log('');
    return 1;
  }
}
