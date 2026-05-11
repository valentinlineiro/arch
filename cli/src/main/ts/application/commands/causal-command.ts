import { CausalGraph, VALID_RELATIONS } from '../use-cases/causal-graph.js';
import { VALID_CONFIDENCES, RELATION_STRENGTH, type RelationType, type Confidence } from '../../domain/models/causal-relation.js';

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
    } else if (subcommand === 'weaken') {
      await this.correct(rest, 'weaken');
    } else if (subcommand === 'invalidate') {
      await this.correct(rest, 'invalidate');
    } else {
      this.io.error(
        'Usage: arch causal <add|show|weaken|invalidate>\n' +
        '  add <from> <relation> <to> [--note "..."] [--confidence asserted|inferred|heuristic]\n' +
        '  show <entity> [--all]\n' +
        '  weaken <edge-id> [--note "..."]\n' +
        '  invalidate <edge-id> [--note "..."]\n\n' +
        `Relations: ${VALID_RELATIONS.join(', ')}`,
      );
      this.io.exit(1);
    }
  }

  private parseFlag(args: string[], flag: string): { value: string | undefined; rest: string[] } {
    const idx = args.indexOf(flag);
    if (idx === -1) return { value: undefined, rest: args };
    const value = args[idx + 1];
    const rest = [...args.slice(0, idx), ...args.slice(idx + 2)];
    return { value, rest };
  }

  private async add(args: string[]): Promise<void> {
    const { value: note, rest: afterNote } = this.parseFlag(args, '--note');
    const { value: confidenceRaw, rest: core } = this.parseFlag(afterNote, '--confidence');

    if (core.length < 3) {
      this.io.error('Usage: arch causal add <from> <relation> <to> [--note "..."] [--confidence asserted|inferred|heuristic]');
      this.io.exit(1);
    }

    const [from, relation, ...toParts] = core;
    const to = toParts.join(' ');

    if (!(VALID_RELATIONS as readonly string[]).includes(relation)) {
      this.io.error(`Invalid relation: "${relation}"\nValid: ${VALID_RELATIONS.join(', ')}`);
      this.io.exit(1);
    }

    const confidence: Confidence = (confidenceRaw as Confidence) ?? 'asserted';
    if (!(VALID_CONFIDENCES as readonly string[]).includes(confidence)) {
      this.io.error(`Invalid confidence: "${confidenceRaw}"\nValid: ${VALID_CONFIDENCES.join(', ')}`);
      this.io.exit(1);
    }

    const entry = await this.graph.add(from, relation as RelationType, to, note, confidence);
    const strength = RELATION_STRENGTH[relation as RelationType];
    this.io.log(
      `Recorded [${entry.id.slice(0, 8)}]: ${entry.from} → ${entry.relation} → ${entry.to}` +
      ` [${entry.confidence}/${entry.source}, ${strength}]` +
      (entry.note ? ` · ${entry.note}` : ''),
    );
  }

  private async correct(args: string[], action: 'weaken' | 'invalidate'): Promise<void> {
    const { value: note, rest: core } = this.parseFlag(args, '--note');
    if (core.length === 0) {
      this.io.error(`Usage: arch causal ${action} <edge-id> [--note "..."]`);
      this.io.exit(1);
    }

    const id = core[0];
    try {
      const correction = action === 'weaken'
        ? await this.graph.weaken(id, note)
        : await this.graph.invalidate(id, note);
      this.io.log(
        `${action === 'weaken' ? 'Weakened' : 'Invalidated'} [${id.slice(0, 8)}]: ` +
        `${correction.from} → ${correction.relation} → ${correction.to}` +
        (correction.note ? ` · ${correction.note}` : ''),
      );
    } catch (e: any) {
      this.io.error(`Error: ${e.message}`);
      this.io.exit(1);
    }
  }

  private async show(args: string[]): Promise<void> {
    const { value: allFlag, rest: core } = this.parseFlag(args, '--all');
    const showAll = allFlag !== undefined || args.includes('--all');

    if (core.length === 0) {
      this.io.error('Usage: arch causal show <entity> [--all]');
      this.io.exit(1);
    }

    const entity = core[0];
    const { outgoing, incoming } = await this.graph.query(entity, showAll);

    if (outgoing.length === 0 && incoming.length === 0) {
      this.io.log(`No ${showAll ? '' : 'active '}causal relations found for ${entity}.`);
      return;
    }

    this.io.log(`Causal relations for ${entity}${showAll ? ' (all)' : ''}:`);
    this.io.log('');

    if (outgoing.length > 0) {
      this.io.log('  Outgoing:');
      for (const r of outgoing) {
        const strength = RELATION_STRENGTH[r.relation];
        this.io.log(
          `    [${r.id.slice(0, 8)}] ${r.from} → ${r.relation} → ${r.to}` +
          ` [${r.confidence}/${r.source ?? 'human'}, ${strength}, ${r.status}]` +
          (r.note ? ` · ${r.note}` : ''),
        );
      }
    }

    if (incoming.length > 0) {
      this.io.log('  Incoming:');
      for (const r of incoming) {
        const strength = RELATION_STRENGTH[r.relation];
        this.io.log(
          `    [${r.id.slice(0, 8)}] ${r.from} → ${r.relation} → ${r.to}` +
          ` [${r.confidence}/${r.source ?? 'human'}, ${strength}, ${r.status}]` +
          (r.note ? ` · ${r.note}` : ''),
        );
      }
    }
  }
}
