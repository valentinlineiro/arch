import { randomUUID } from 'node:crypto';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import {
  VALID_RELATIONS,
  RELATION_STRENGTH,
  type CausalRelation,
  type RelationType,
  type Confidence,
  type CausalSource,
  type EdgeStatus,
} from '../../domain/models/causal-relation.js';

const GRAPH_PATH = '.arch/causal-graph.jsonl';

export { VALID_RELATIONS };

export interface ScoredEdge {
  edge: CausalRelation;
  weight: number;
}

export interface BeliefSynthesis {
  entity: string;
  dominant: ScoredEdge[];    // highest-weight active edge per (from, to) pair
  competing: ScoredEdge[];   // lower-weight active edges for same (from, to) pairs
  superseded: ScoredEdge[];  // once-active edges now weakened or invalidated
}

function scoreEdge(e: CausalRelation): number {
  const conf = e.confidence === 'asserted' ? 3 : e.confidence === 'inferred' ? 2 : 1;
  const str = RELATION_STRENGTH[e.relation] === 'STRONG' ? 3 : RELATION_STRENGTH[e.relation] === 'MEDIUM' ? 2 : 1;
  const src = (e.source ?? 'human') === 'human' ? 1.2 : 1.0;
  return conf * str * src;
}

// Additive delta per edge relation strength, used as accumulation units before log compression.
function edgeDelta(relation: RelationType): number {
  return RELATION_STRENGTH[relation] === 'STRONG' ? 0.5
    : RELATION_STRENGTH[relation] === 'MEDIUM' ? 0.3
    : 0.1;
}

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

  // Belief synthesis: for a given entity, returns the dominant interpretation
  // (highest-weight active edge per entity pair), competing interpretations
  // (lower-weight active edges for same pairs), and superseded beliefs
  // (edges that were active but have since been weakened or invalidated).
  async synthesize(entity: string): Promise<BeliefSynthesis> {
    const allEdges = await this.all();
    const overrides = new Map<string, EdgeStatus>();
    for (const e of allEdges) {
      if (e.invalidates) overrides.set(e.invalidates, e.status);
    }

    const originals = allEdges.filter(e => !e.invalidates);
    const forEntity = originals.filter(e => e.from === entity || e.to === entity);

    const active = forEntity.filter(e => (overrides.get(e.id) ?? e.status) === 'active');
    const inactive = forEntity.filter(e => (overrides.get(e.id) ?? e.status) !== 'active');

    // Group active edges by (from, to) pair — competing interpretations of the same relationship
    const scored = active.map(e => ({ edge: e, weight: scoreEdge(e) }));
    const groups = new Map<string, ScoredEdge[]>();
    for (const s of scored) {
      const key = `${s.edge.from}||${s.edge.to}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    }

    const dominant: ScoredEdge[] = [];
    const competing: ScoredEdge[] = [];
    for (const [, group] of groups) {
      group.sort((a, b) => b.weight - a.weight);
      dominant.push(group[0]);
      competing.push(...group.slice(1));
    }
    dominant.sort((a, b) => b.weight - a.weight);

    const superseded = inactive.map(e => ({
      edge: { ...e, status: overrides.get(e.id) ?? e.status },
      weight: scoreEdge(e),
    }));

    return { entity, dominant, competing, superseded };
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

  // Path-conditioned activation: returns a score multiplier ≥ 1.0 for use in retrieval scoring.
  // Candidate is boosted only when there is a direct active edge connecting it to a query entity.
  // Multiple qualifying edges accumulate additively before log compression to prevent explosion.
  // Inactive (weakened/invalidated) edges contribute nothing — the prior reflects current belief only.
  async causalRelevance(candidate: string, queryEntities: string[]): Promise<number> {
    if (queryEntities.length === 0 || !candidate) return 1.0;
    const querySet = new Set(queryEntities);
    const allEdges = await this.all();
    const overrides = new Map<string, EdgeStatus>();
    for (const e of allEdges) {
      if (e.invalidates) overrides.set(e.invalidates, e.status);
    }

    // Dominant-per-pair selection: among active edges between candidate and a query entity,
    // keep only the highest-scoring edge per (from, to) pair to avoid double-counting
    // competing interpretations of the same relationship.
    const pairDominant = new Map<string, CausalRelation>();
    for (const edge of allEdges) {
      if (edge.invalidates) continue;
      if ((overrides.get(edge.id) ?? edge.status) !== 'active') continue;
      const candidateIsFrom = edge.from === candidate;
      const candidateIsTo = edge.to === candidate;
      if (!candidateIsFrom && !candidateIsTo) continue;
      const otherEnd = candidateIsFrom ? edge.to : edge.from;
      if (!querySet.has(otherEnd)) continue;
      const key = `${edge.from}||${edge.to}`;
      const existing = pairDominant.get(key);
      if (!existing || scoreEdge(edge) > scoreEdge(existing)) pairDominant.set(key, edge);
    }

    if (pairDominant.size === 0) return 1.0;

    const accumulation = [...pairDominant.values()].reduce((sum, e) => sum + edgeDelta(e.relation), 0);
    return 1.0 + Math.log(1 + accumulation);
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
