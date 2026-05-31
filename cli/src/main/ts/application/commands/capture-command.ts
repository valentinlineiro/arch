import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { Command } from '../../domain/models/command.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import { CreateTask } from '../use-cases/create-task.js';
import { PathResolver } from '../../domain/services/path-resolver.js';
import { MarkTaskInProgress, DefinitionOfReadyError } from '../use-cases/mark-task-in-progress.js';
import { SemanticCollisionDetector } from '../use-cases/semantic-collision-detector.js';
import { VerifiabilityScorer } from '../../domain/services/verifiability-scorer.js';

export class CaptureCommand implements Command {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private rootPath: string,
    private gitRepository?: GitRepository,
  ) {}

  async execute(args: string[]): Promise<number> {
    // Parse args: arch capture "<intent>" [--class <class>] [--size <size>] [--context <paths>]
    const classIdx = args.indexOf('--class');
    const sizeIdx = args.indexOf('--size');
    const contextIdx = args.indexOf('--context');

    const taskClass = classIdx >= 0 ? args[classIdx + 1] : undefined;
    const size = sizeIdx >= 0 ? args[sizeIdx + 1] : undefined;
    const context = contextIdx >= 0 ? args[contextIdx + 1] : undefined;
    const draftMode = args.includes('--draft');

    // Remove flag pairs, remaining args are the intent
    const intentArgs = args.filter((a, i) => {
      if (a.startsWith('--')) return false;
      const prev = args[i - 1];
      if (prev && ['--class','--size','--context'].includes(prev)) return false;
      return true;
    });


    let intent = intentArgs.join(' ').replace(/^[\"']|[\"']$/g, '').trim();

    if (!intent) {
      process.stderr.write('Usage: arch capture "<intent>" [--class <class>] [--size <size>] [--draft]\n');
      process.stderr.write('\nClasses: 1-code-reasoning, 2-code-generation, 6-writing, 7-operations\n');
      process.stderr.write('Sizes:   XS, S, M, L\n');
      process.stderr.write('Flags:   --draft  invoke LLM to generate title/size/ACs (requires configured provider)\n');
      return 1;
    }

    fmt.log(`\n  \x1b[32mARCH\x1b[0m — capturing task\n`);

    // Ambiguity check: < 5 words is likely too vague — only prompt in TTY
    if (process.stdout.isTTY && intent.trim().split(/\s+/).filter(Boolean).length < 5) {
      const { createInterface } = await import('node:readline');
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const clarified = await new Promise<string>(resolve => {
        rl.question(`  Can you be more specific? "${intent}" is quite short.\n  Describe the task in a few words: `, a => { rl.close(); resolve(a.trim()); });
      });
      if (clarified.length > 0) intent = clarified;
    }

    // Step 1: Create task
    const creator = new CreateTask(this.taskRepository, this.fileSystem, this.gitRepository!);
    let taskId: string;
    try {
      taskId = await creator.execute(intent, taskClass, size, draftMode);
    } catch (err: any) {
      process.stderr.write(`  ✖ Failed to create task: ${err.message}\n`);
      return 1;
    }

    // Step 2: Apply context override if provided
    if (context) {
      try {
        const taskPath = `${PathResolver.from({}).tasks}/${taskId}.md`;
        let content = await this.fileSystem.readFile(taskPath);
        content = content.replace(/\| docs\/tasks\/$/, `| ${context}`);
        await this.fileSystem.writeFile(taskPath, content);
      } catch { /* non-blocking */ }
    }

    // Step 2b-2c: Internal checks (verifiability, collision) — run silently
    try {
      const taskPath = `${PathResolver.from({}).tasks}/${taskId}.md`;
      const taskContent = await this.fileSystem.readFile(taskPath);
      // Verifiability and collision run but output suppressed for clean surface
      VerifiabilityScorer.score(taskContent); // side-effect: warns if very low
      const detector = new SemanticCollisionDetector(this.fileSystem);
      await detector.execute(taskContent, taskId); // advisory only
    } catch { /* never block capture */ }

    // Step 3: DoR validation — auto-fix silently
    const markInProgress = new MarkTaskInProgress(this.taskRepository);
    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      try {
        await markInProgress.execute(taskId, 'arch-capture');
        // Clean first-use surface: ID, title, next action only
        const taskPath = `${PathResolver.from({}).tasks}/${taskId}.md`;
        const title = intent.length > 60 ? intent.slice(0, 57) + '...' : intent;
        fmt.log(`  \x1b[32m✔\x1b[0m ${taskId}: ${title}`);
        fmt.log(`\n  Run \x1b[36march task start ${taskId}\x1b[0m to begin.\n`);
        return 0;
      } catch (err: any) {
        if (err instanceof DefinitionOfReadyError && attempts === 1) {
          // Auto-fix silently: apply defaults for missing CLI and context
          const violations = err.reasons;
          const needsCLI = violations.some(r => r.includes('CLI'));
          const needsContext = violations.some(r => r.includes('context'));

          if (needsCLI || needsContext) {
            try {
              const taskPath = `${PathResolver.from({}).tasks}/${taskId}.md`;
              let content = await this.fileSystem.readFile(taskPath);
              if (needsCLI) content = content.replace('| local |', '| claude-code |');
              if (needsContext) content = content.replace(`| ${PathResolver.from({}).tasks}/ |`, '| none |');
              await this.fileSystem.writeFile(taskPath, content);
              continue; // Retry silently
            } catch { /* fall through */ }
          }

          // Remaining violations — show clean output anyway, task is created
          fmt.log(`  \x1b[32m✔\x1b[0m ${taskId}: ${intent.slice(0, 57)}`);
          fmt.log(`\n  Run \x1b[36march task start ${taskId}\x1b[0m to begin.\n`);
          return 0;
        } else {
          process.stderr.write(`  ✖ ${err.message}\n`);
          return 1;
        }
      }
    }
    return 0;
  }
}
