import { Command } from '../../domain/models/command.js';
import { AskCorpus } from '../use-cases/ask-corpus.js';

export interface AskIO {
  getArgs(): string[];
  log(s: string): void;
  error(s: string): void;
  exit(code: number): never;
}

export class AskCommand implements Command {
  constructor(
    private askCorpus: AskCorpus,
    private io: AskIO,
  ) {}

  async execute(): Promise<void> {
    const args = this.io.getArgs();
    if (args.length === 0) {
      this.io.error('Error: question required\nUsage: arch ask "<question>"');
      this.io.exit(1);
    }

    const question = args.join(' ');
    let result;
    try {
      result = await this.askCorpus.execute(question);
    } catch (e: any) {
      this.io.error(`Error: ${e.message}`);
      this.io.exit(1);
    }

    const { queryClass, keywords, matches, taskRefs, adrRefs, principleRefs, recurringSignals } = result;

    this.io.log(`Query: ${question}`);
    this.io.log(`Class:    ${queryClass} | Keywords: ${keywords.join(', ')}`);
    this.io.log('');

    if (recurringSignals && recurringSignals.length > 0) {
      this.io.log('Recurrence detected:');
      for (const s of recurringSignals) {
        this.io.log(`  ${s.label} — ${s.count}x (${s.taskIds.join(', ')})`);
      }
      this.io.log('');
    }

    if (matches.length === 0) {
      this.io.log('No matches found in corpus.');
      return;
    }

    this.io.log(`Corpus matches (${matches.length}):`);
    for (const m of matches) {
      this.io.log(`  ${m.path} — score ${Math.round(m.score)}`);
      this.io.log(`    ${m.excerpt}`);
      this.io.log(`    why: ${m.reasons.join(' | ')}`);
    }
    this.io.log('');

    if (taskRefs.length > 0) this.io.log(`Related tasks (top-5 matches): ${taskRefs.join(', ')}`);
    if (adrRefs.length > 0) this.io.log(`Related ADRs:                  ${adrRefs.join(', ')}`);
    if (principleRefs.length > 0) this.io.log(`Related principles:            ${principleRefs.join(', ')}`);
  }
}
