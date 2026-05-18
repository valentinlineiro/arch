import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import { CreateTask } from '../use-cases/create-task.js';
import { MarkTaskInProgress, DefinitionOfReadyError } from '../use-cases/mark-task-in-progress.js';

export class CaptureCommand {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private rootPath: string,
    private gitRepository?: GitRepository,
  ) {}

  async execute(args: string[]): Promise<void> {
    // Parse args: arch capture "<intent>" [--class <class>] [--size <size>] [--context <paths>]
    const classIdx = args.indexOf('--class');
    const sizeIdx = args.indexOf('--size');
    const contextIdx = args.indexOf('--context');

    const taskClass = classIdx >= 0 ? args[classIdx + 1] : undefined;
    const size = sizeIdx >= 0 ? args[sizeIdx + 1] : undefined;
    const context = contextIdx >= 0 ? args[contextIdx + 1] : undefined;

    // Remove flag pairs, remaining args are the intent
    const intentArgs = args.filter((a, i) => {
      if (a.startsWith('--')) return false;
      const prev = args[i - 1];
      if (prev && ['--class','--size','--context'].includes(prev)) return false;
      return true;
    });
    const intent = intentArgs.join(' ').replace(/^[\"']|[\"']$/g, '').trim();

    if (!intent) {
      process.stderr.write('Usage: arch capture "<intent>" [--class <class>] [--size <size>]\n');
      process.stderr.write('\nClasses: 1-code-reasoning, 2-code-generation, 6-writing, 7-operations\n');
      process.stderr.write('Sizes:   XS, S, M, L\n');
      process.exit(1);
    }

    console.log(`\n  → arch capture: "${intent.slice(0, 60)}"\n`);

    // Step 1: Create task (size passed to scaffold for template selection)
    const creator = new CreateTask(this.taskRepository, this.fileSystem, this.gitRepository!);
    let taskId: string;
    try {
      taskId = await creator.execute(intent, taskClass, size);
      console.log(`  ✔ Created ${taskId}`);
    } catch (err: any) {
      process.stderr.write(`  ✖ Failed to create task: ${err.message}\n`);
      process.exit(1);
    }

    // Step 2: Apply context override if provided
    if (context) {
      try {
        const taskPath = `docs/tasks/${taskId}.md`;
        let content = await this.fileSystem.readFile(taskPath);
        content = content.replace(/\| docs\/tasks\/$/, `| ${context}`);
        await this.fileSystem.writeFile(taskPath, content);
      } catch { /* non-blocking */ }
    }

    // Step 3: Attempt DoR validation — auto-fix mechanical violations
    const markInProgress = new MarkTaskInProgress(this.taskRepository);
    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      try {
        await markInProgress.execute(taskId, 'arch-capture');
        console.log(`  ✔ ${taskId} is IN_PROGRESS and READY\n`);
        console.log(`  Task: docs/tasks/${taskId}.md`);
        console.log(`  Next: arch task done ${taskId}\n`);
        return;
      } catch (err: any) {
        if (err instanceof DefinitionOfReadyError && attempts === 1) {
          // Auto-fix: apply defaults for missing CLI and context
          const violations = err.reasons;
          const needsCLI = violations.some(r => r.includes('CLI'));
          const needsContext = violations.some(r => r.includes('context'));

          if (needsCLI || needsContext) {
            try {
              const taskPath = `docs/tasks/${taskId}.md`;
              let content = await this.fileSystem.readFile(taskPath);
              if (needsCLI) content = content.replace('| local |', '| claude-code |');
              if (needsContext) content = content.replace('| docs/tasks/ |', '| none |');
              await this.fileSystem.writeFile(taskPath, content);
              console.log(`  → Auto-fixed: ${violations.filter(v => v.includes('CLI') || v.includes('context')).join(', ')}`);
              continue;
            } catch { /* fall through */ }
          }

          // Remaining violations require human input
          const remaining = violations.filter(v => !v.includes('CLI') && !v.includes('context'));
          if (remaining.length > 0) {
            if (process.stdout.isTTY) {
              console.log(`\n  ⚠ Manual fixes required in docs/tasks/${taskId}.md:`);
              for (const v of remaining) console.log(`    - ${v}`);
              console.log(`\n  Edit the file then run: arch task start ${taskId}\n`);
            } else {
              process.stderr.write(`Cannot auto-fix: ${remaining.join('; ')}. Edit docs/tasks/${taskId}.md then run: arch task start ${taskId}\n`);
            }
            process.exit(1);
          }
        } else {
          process.stderr.write(`  ✖ ${err.message}\n`);
          process.exit(1);
        }
      }
    }
  }
}
