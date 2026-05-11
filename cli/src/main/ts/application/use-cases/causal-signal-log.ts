import { randomUUID } from 'node:crypto';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { RelationType } from '../../domain/models/causal-relation.js';
import {
  type CausalSignal,
  type CausalSignalUpdate,
  type SignalDomain,
  type SignalStatus,
  type SignalType,
} from '../../domain/models/causal-signal.js';

const SIGNAL_PATH = '.arch/causal-signal.jsonl';

type RawRecord = CausalSignal | CausalSignalUpdate;

function isUpdate(r: RawRecord): r is CausalSignalUpdate {
  return 'signal_id' in r;
}

export class CausalSignalLog {
  constructor(
    private fileSystem: FileSystem,
    private rootPath: string,
  ) {}

  async append(params: {
    domain: SignalDomain;
    signal_type: SignalType;
    candidate_from: string;
    candidate_relation: RelationType;
    candidate_to: string;
    edge_id?: string;
    confidence: number;
    event: string;
  }): Promise<CausalSignal> {
    const signal: CausalSignal = {
      id: randomUUID(),
      ...params,
      source: 'system',
      status: 'pending',
      review_count: 0,
      timestamp: new Date().toISOString(),
    };
    await this.fileSystem.appendFile(`${this.rootPath}/${SIGNAL_PATH}`, JSON.stringify(signal) + '\n');
    return signal;
  }

  async pending(): Promise<CausalSignal[]> {
    const current = await this.currentState();
    return [...current.values()].filter(s => s.status === 'pending');
  }

  async all(): Promise<CausalSignal[]> {
    const current = await this.currentState();
    return [...current.values()];
  }

  async updateStatuses(updates: Array<{ id: string; status: SignalStatus; review_count: number }>): Promise<void> {
    const now = new Date().toISOString();
    const lines = updates
      .map(u => JSON.stringify({ signal_id: u.id, status: u.status, review_count: u.review_count, timestamp: now } satisfies CausalSignalUpdate))
      .join('\n');
    if (lines) {
      await this.fileSystem.appendFile(`${this.rootPath}/${SIGNAL_PATH}`, lines + '\n');
    }
  }

  private async currentState(): Promise<Map<string, CausalSignal>> {
    let raw: string;
    try {
      raw = await this.fileSystem.readFile(`${this.rootPath}/${SIGNAL_PATH}`);
    } catch {
      return new Map();
    }

    const records = raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as RawRecord);
    const signals = new Map<string, CausalSignal>();
    // Last update per signal_id wins — iterate in order, later updates overwrite earlier
    const overrides = new Map<string, { status: SignalStatus; review_count: number }>();

    for (const r of records) {
      if (isUpdate(r)) {
        overrides.set(r.signal_id, { status: r.status, review_count: r.review_count });
      } else {
        signals.set(r.id, r);
      }
    }

    const result = new Map<string, CausalSignal>();
    for (const [id, sig] of signals) {
      const override = overrides.get(id);
      result.set(id, override ? { ...sig, ...override } : sig);
    }
    return result;
  }
}
