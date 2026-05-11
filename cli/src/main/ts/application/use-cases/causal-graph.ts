import { randomUUID } from 'node:crypto';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import {
  VALID_RELATIONS,
  type CausalRelation,
  type RelationType,
  type Confidence,
  type CausalSource,
  type EdgeStatus,
} from '../../domain/models/causal-relation.js';

const GRAPH_PATH = '.arch/causal-graph.jsonl';

export { VALID_RELATIONS };

export class CausalGraph {
  constructor(
    private fileSystem: FileSystem,
    private rootPath: string,
  ) {}

  async add(
    from: string,
    relation: RelationType,
    to: string,
    note?: string,
    confidence: Confidence = 'asserted',
    source: CausalSource = 'human',
  ): Promise<CausalRelation> {
    const entry: CausalRelation = {
      id: randomUUID(),
      from,
      to,
      relation,
      confidence,
      source,
      status: 'active',
      timestamp: new Date().toISOString(),
      ...(note ? { note } : {}),
    };
    await this.fileSystem.appendFile(`${this.rootPath}/${GRAPH_PATH}`, JSON.stringify(entry) + '\n');
    return entry;
  }

  async weaken(id: string, note?: string): Promise<CausalRelation> {
    return this.correct(id, 'weakened', note);
  }

  async invalidate(id: string, note?: string): Promise<CausalRelation> {
    return this.correct(id, 'invalidated', note);
  }

  // Returns only currently-believed edges (status === 'active' after applying corrections).
  // The historical file is always preserved — this is a filtered view, not a deletion.
  async active(): Promise<CausalRelation[]> {
    const all = await this.all();
    // Build a map: originalId -> most recent override status from correction records
    const overrides = new Map<string, EdgeStatus>();
    for (const edge of all) {
      if (edge.invalidates) {
        overrides.set(edge.invalidates, edge.status);
      }
    }
    // Original edges only (no invalidates field), filtered to active effective status
    return all
      .filter(e => !e.invalidates)
      .filter(e => (overrides.get(e.id) ?? e.status) === 'active');
  }

  async query(entity: string, includeInactive = false): Promise<{ outgoing: CausalRelation[]; incoming: CausalRelation[] }> {
    const edges = includeInactive ? (await this.all()).filter(e => !e.invalidates) : await this.active();
    const overrides = includeInactive ? await this.buildOverrides() : new Map<string, EdgeStatus>();
    const withStatus = (e: CausalRelation) => ({ ...e, status: overrides.get(e.id) ?? e.status });
    return {
      outgoing: edges.filter(r => r.from === entity).map(withStatus),
      incoming: edges.filter(r => r.to === entity).map(withStatus),
    };
  }

  async all(): Promise<CausalRelation[]> {
    let raw: string;
    try {
      raw = await this.fileSystem.readFile(`${this.rootPath}/${GRAPH_PATH}`);
    } catch {
      return [];
    }
    return raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as CausalRelation);
  }

  private async buildOverrides(): Promise<Map<string, EdgeStatus>> {
    const all = await this.all();
    const overrides = new Map<string, EdgeStatus>();
    for (const edge of all) {
      if (edge.invalidates) overrides.set(edge.invalidates, edge.status);
    }
    return overrides;
  }

  private async correct(id: string, newStatus: 'weakened' | 'invalidated', note?: string): Promise<CausalRelation> {
    const all = await this.all();
    const original = all.find(e => e.id === id && !e.invalidates);
    if (!original) throw new Error(`Edge not found: ${id}`);
    const correction: CausalRelation = {
      ...original,
      id: randomUUID(),
      status: newStatus,
      invalidates: id,
      timestamp: new Date().toISOString(),
      ...(note ? { note } : {}),
    };
    await this.fileSystem.appendFile(`${this.rootPath}/${GRAPH_PATH}`, JSON.stringify(correction) + '\n');
    return correction;
  }
}
