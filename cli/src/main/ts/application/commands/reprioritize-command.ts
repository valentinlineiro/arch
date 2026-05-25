import { Command } from '../../domain/models/command.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { ReprioritizeCorpus } from '../use-cases/reprioritize-corpus.js';
import type { PriorityDiffEntry } from '../use-cases/reprioritize-corpus.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

function pad(s: string, n: number): string {
  return s.padEnd(n).slice(0, n);
}

export class ReprioritizeCommand implements Command {
  constructor(
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private rootPath: string = '.',
  ) {}

  async execute(args: string[]): Promise<void> {
    const dryRun = !args.includes('--apply');

    console.log(`\n  \x1b[32mARCH\x1b[0m — arch task reprioritize\n`);

    const useCase = new ReprioritizeCorpus(this.taskRepository, this.fileSystem, this.rootPath);
    const { diff, ecpPath } = await useCase.execute();

    if (diff.length === 0) {
      console.log('  No priority changes proposed. Corpus signals are consistent with current priority assignments.\n');
      console.log(`  ECP registry: ${ecpPath}\n`);
      return;
    }

    console.log(`  ${pad('Task', 12)} ${pad('Current', 8)} ${pad('Proposed', 9)} Signals`);
    console.log(`  ${'─'.repeat(65)}`);

    for (const entry of diff) {
      const arrow = this.priorityArrow(entry.currentPriority, entry.proposedPriority);
      const signals = this.formatSignals(entry);
      console.log(`  ${pad(entry.taskId, 12)} ${pad(entry.currentPriority, 8)} ${arrow} ${pad(entry.proposedPriority, 9)} ${signals}`);
    }

    console.log(`\n  ECP registry: ${ecpPath}`);

    if (dryRun) {
      console.log(`\n  Dry-run mode. Run with --apply to prompt for confirmation.\n`);
      return;
    }

    // Apply? y/N
    console.log('');
    const { createInterface } = await import('node:readline/promises');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question('  Apply? (y/N) ');
    rl.close();

    if (answer.trim().toLowerCase() !== 'y') {
      console.log('  Cancelled.\n');
      return;
    }

    // Write priority changes
    let applied = 0;
    for (const entry of diff) {
      try {
        const taskPath = `${this.rootPath}/${PathResolver.from({}).tasks}/${entry.taskId}.md`;
        let content = await this.fileSystem.readFile(taskPath);
        content = content.replace(
          /(\*\*Meta:\*\*\s+)(P[0-3])(\s*\|)/,
          `$1${entry.proposedPriority}$3`,
        );
        await this.fileSystem.writeFile(taskPath, content);
        applied++;
      } catch { /* skip archived/missing tasks */ }
    }

    console.log(`\n  ✔ Applied ${applied} priority change(s).\n`);
  }

  private priorityArrow(current: string, proposed: string): string {
    const curr = parseInt(current.slice(1));
    const prop = parseInt(proposed.slice(1));
    if (prop < curr) return '↑';
    if (prop > curr) return '↓';
    return '→';
  }

  private formatSignals(entry: PriorityDiffEntry): string {
    const { signals } = entry;
    const parts: string[] = [];
    parts.push(`recurrence:${signals.recurrenceCount}`);
    parts.push(`fan-out:${signals.fanOutCount}`);
    parts.push(`age:${signals.ageDays}d`);
    if (signals.causalAncestry) parts.push(`causal:${signals.causalAncestry}`);
    if (signals.classMismatch) parts.push('class-mismatch');
    return parts.join(' | ');
  }
}
