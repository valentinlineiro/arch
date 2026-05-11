import { CausalGraph, VALID_RELATIONS } from '../use-cases/causal-graph.js';
import type { RelationType } from '../../domain/models/causal-relation.js';

export interface CausalIO {
  getArgs(): string[];
  log(s: string): void;
  error(s: string): void;
  exit(code: number): never;
}

export class CausalCommand {
  constructor(
    private graph: CausalGraph,
    private io: CausalIO,
  ) {}

  async execute(): Promise<void> {
    const [subcommand, ...rest] = this.io.getArgs();

    if (subcommand === 'add') {
      await this.add(rest);
    } else if (subcommand === 'show') {
      await this.show(rest);
    } else {
      this.io.error(
        'Usage: arch causal <add|show>\n' +
        '  add <from> <relation> <to> [--note "..."]\n' +
        `  show <entity>\n` +
        `\nRelations: ${VALID_RELATIONS.join(', ')}`,
      );
      this.io.exit(1);
    }
  }

  private async add(args: string[]): Promise<void> {
    const noteIdx = args.indexOf('--note');
    const core = noteIdx === -1 ? args : args.slice(0, noteIdx);
    const note = noteIdx !== -1 ? args.slice(noteIdx + 1).join(' ') || undefined : undefined;

    if (core.length < 3) {
      this.io.error('Usage: arch causal add <from> <relation> <to> [--note "..."]');
      this.io.exit(1);
    }

    const [from, relation, ...toParts] = core;
    const to = toParts.join(' ');

    if (!(VALID_RELATIONS as readonly string[]).includes(relation)) {
      this.io.error(`Invalid relation: "${relation}"\nValid: ${VALID_RELATIONS.join(', ')}`);
      this.io.exit(1);
    }

    const entry = await this.graph.add(from, relation as RelationType, to, note);
    this.io.log(`Recorded: ${entry.from} → ${entry.relation} → ${entry.to}${entry.note ? ` · ${entry.note}` : ''}`);
  }

  private async show(args: string[]): Promise<void> {
    if (args.length === 0) {
      this.io.error('Usage: arch causal show <entity>');
      this.io.exit(1);
    }

    const entity = args[0];
    const { outgoing, incoming } = await this.graph.query(entity);

    if (outgoing.length === 0 && incoming.length === 0) {
      this.io.log(`No causal relations found for ${entity}.`);
      return;
    }

    this.io.log(`Causal relations for ${entity}:`);
    this.io.log('');

    if (outgoing.length > 0) {
      this.io.log('  Outgoing:');
      for (const r of outgoing) {
        this.io.log(`    ${r.from} → ${r.relation} → ${r.to}${r.note ? ` · ${r.note}` : ''}`);
      }
    }

    if (incoming.length > 0) {
      this.io.log('  Incoming:');
      for (const r of incoming) {
        this.io.log(`    ${r.from} → ${r.relation} → ${r.to}${r.note ? ` · ${r.note}` : ''}`);
      }
    }
  }
}
