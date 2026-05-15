import type { CausalSignal, SignalStatus } from '../../domain/models/causal-signal.js';
import { SIGNAL_DOMAIN_PRIORITY } from '../../domain/models/causal-signal.js';
import type { RelationType } from '../../domain/models/causal-relation.js';
import type { CausalSignalLog } from './causal-signal-log.js';
import type { CausalGraph } from './causal-graph.js';

export interface ArbitrationAction {
  signal_ids: string[];
  edge_from: string;
  edge_relation: RelationType;
  edge_to: string;
  action: 'create' | 'weaken';
  new_edge_id?: string;
}

export interface ConflictRecord {
  signal_ids: string[];
  candidate_from: string;
  candidate_relation: RelationType;
  candidate_to: string;
}

export interface ArbitrationResult {
  applied: ArbitrationAction[];
  conflicted: ConflictRecord[];
  stale: string[];
  still_pending: number;
}

// ARBITRATION DETERMINISM INVARIANT:
// Signals are sorted before evaluation by: timestamp ASC, then domain priority
// (ontological < epistemological < normative), then id lexicographically.
// This guarantees identical input always produces identical output regardless
// of signal insertion order or concurrent writes.
function sortForDeterminism(signals: CausalSignal[]): CausalSignal[] {
  return [...signals].sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp < b.timestamp ? -1 : 1;
    const dp = SIGNAL_DOMAIN_PRIORITY[a.domain] - SIGNAL_DOMAIN_PRIORITY[b.domain];
    if (dp !== 0) return dp;
    return a.id < b.id ? -1 : 1;
  });
}

export class CausalArbitrator {
  constructor(
    private signalLog: CausalSignalLog,
    private graph: CausalGraph,
    readonly expiryReviews: number = 3,
  ) {}

  async arbitrate(): Promise<ArbitrationResult> {
    const raw = await this.signalLog.pending();
    const activeEdges = await this.graph.active();
    
    // BOOTSTRAP MODE: If the graph is sparse (< 100 edges), lower the corroboration 
    // threshold to 1. In a small corpus, requiring cross-domain evidence is hostile 
    // to learning. High-volume maturity (size >= 100) requires >= 2 domains.
    const bootstrapMode = activeEdges.length < 100;
    const requiredDomains = bootstrapMode ? 1 : 2;

    // ARBITRATION DETERMINISM INVARIANT: sort before any grouping or evaluation
    const signals = sortForDeterminism(raw);

    // Group by candidate edge (from, relation, to) — collapsed before evaluation so that
    // conflict resolution does not depend on iteration order within a group.
    const groups = new Map<string, CausalSignal[]>();
    for (const signal of signals) {
      const key = `${signal.candidate_from}||${signal.candidate_relation}||${signal.candidate_to}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(signal);
    }

    const applied: ArbitrationAction[] = [];
    const conflicted: ConflictRecord[] = [];
    const staleIds: string[] = [];
    const statusUpdates: Array<{ id: string; status: SignalStatus; review_count: number }> = [];

    for (const [, group] of groups) {
      // Normative signals are never auto-applied. They tick toward expiry like any other signal
      // but are excluded from corroboration evaluation. They surface as review hints.
      const nonNormative = group.filter(s => s.domain !== 'normative');
      const reinforce = nonNormative.filter(s => s.signal_type === 'reinforce' || s.signal_type === 'create');
      const weaken = nonNormative.filter(s => s.signal_type === 'weaken');
      const normative = group.filter(s => s.domain === 'normative');

      const reinforceDomains = new Set(reinforce.map(s => s.domain));
      const weakenDomains = new Set(weaken.map(s => s.domain));

      if (reinforce.length > 0 && weaken.length > 0) {
        // Contradiction: opposing non-normative signals — no mutation, surface for human review
        conflicted.push({
          signal_ids: group.map(s => s.id),
          candidate_from: group[0].candidate_from,
          candidate_relation: group[0].candidate_relation,
          candidate_to: group[0].candidate_to,
        });
        for (const s of group) {
          statusUpdates.push({ id: s.id, status: 'conflicted', review_count: s.review_count });
        }
      } else if (reinforceDomains.size >= 2) {
        // Cross-domain corroboration for create/reinforce — commit inferred edge to graph
        const sample = group[0];
        const events = [...new Set(reinforce.map(s => s.event))].join(', ');
        const newEdge = await this.graph.add(
          sample.candidate_from,
          sample.candidate_relation,
          sample.candidate_to,
          `inferred from: ${events}`,
          'inferred',
          'system',
        );
        applied.push({
          signal_ids: reinforce.map(s => s.id),
          edge_from: sample.candidate_from,
          edge_relation: sample.candidate_relation,
          edge_to: sample.candidate_to,
          action: 'create',
          new_edge_id: newEdge.id,
        });
        for (const s of reinforce) {
          statusUpdates.push({ id: s.id, status: 'applied', review_count: s.review_count });
        }
        // Normative signals for same pair are not applied but still tick
        for (const s of normative) this.tick(s, statusUpdates, staleIds);
      } else if (weakenDomains.size >= 2) {
        // Cross-domain corroboration for weaken — apply to referenced edge
        const sample = weaken[0];
        if (sample.edge_id) {
          try {
            const events = [...new Set(weaken.map(s => s.event))].join(', ');
            await this.graph.weaken(sample.edge_id, `auto-weakened: ${events}`);
            applied.push({
              signal_ids: weaken.map(s => s.id),
              edge_from: sample.candidate_from,
              edge_relation: sample.candidate_relation,
              edge_to: sample.candidate_to,
              action: 'weaken',
            });
            for (const s of weaken) {
              statusUpdates.push({ id: s.id, status: 'applied', review_count: s.review_count });
            }
          } catch {
            // Edge already corrected — treat signals as stale
            for (const s of weaken) this.tick(s, statusUpdates, staleIds);
          }
        } else {
          for (const s of weaken) this.tick(s, statusUpdates, staleIds);
        }
        for (const s of normative) this.tick(s, statusUpdates, staleIds);
      } else {
        // Single domain, normative-only, or insufficient signals — tick toward expiry
        for (const s of group) this.tick(s, statusUpdates, staleIds);
      }
    }

    await this.signalLog.updateStatuses(statusUpdates);

    const consumed = statusUpdates.filter(u => u.status !== 'pending').length;
    return { applied, conflicted, stale: staleIds, still_pending: signals.length - consumed };
  }

  private tick(
    signal: CausalSignal,
    updates: Array<{ id: string; status: SignalStatus; review_count: number }>,
    staleIds: string[],
  ): void {
    const next = signal.review_count + 1;
    if (next >= this.expiryReviews) {
      staleIds.push(signal.id);
      updates.push({ id: signal.id, status: 'stale', review_count: next });
    } else {
      updates.push({ id: signal.id, status: 'pending', review_count: next });
    }
  }
}
