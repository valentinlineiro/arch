import { randomUUID } from 'node:crypto';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type {
  DecisionOutcome,
  ReflectDecision,
  ReflectDecisionUpdate,
} from '../../domain/models/reflect-decision.js';

const DECISION_PATH = '.arch/reflect-decisions.jsonl';

type RawRecord = ReflectDecision | ReflectDecisionUpdate;

function isUpdate(r: RawRecord): r is ReflectDecisionUpdate {
  return 'superseded_by' in r || ('finality' in r && !('outcome' in r));
}

export class ReflectDecisionLog {
  constructor(
    private fileSystem: FileSystem,
    private rootPath: string,
  ) {}

  async append(params: {
    target: string;
    outcome: DecisionOutcome;
    influence_declared: boolean;
    based_on_proposals: string[];
  }): Promise<ReflectDecision> {
    const decision: ReflectDecision = {
      decision_id: `D-${randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      target: params.target,
      outcome: params.outcome,
      finality: 'committed',
      influence_declared: params.influence_declared,
      based_on_proposals: params.based_on_proposals,
    };
    await this.fileSystem.appendFile(`${this.rootPath}/${DECISION_PATH}`, JSON.stringify(decision) + '\n');
    return decision;
  }

  async supersede(decisionId: string, supersededBy?: string): Promise<void> {
    const update: ReflectDecisionUpdate = {
      decision_id: decisionId,
      finality: 'superseded',
      timestamp: new Date().toISOString(),
      ...(supersededBy ? { superseded_by: supersededBy } : {}),
    };
    await this.fileSystem.appendFile(`${this.rootPath}/${DECISION_PATH}`, JSON.stringify(update) + '\n');
  }

  /** Returns only committed decisions (canonical view for measurement). */
  async committed(): Promise<ReflectDecision[]> {
    const state = await this.currentState();
    return [...state.values()].filter(d => d.finality === 'committed');
  }

  async forTarget(target: string): Promise<ReflectDecision[]> {
    const all = await this.committed();
    return all.filter(d => d.target === target);
  }

  /**
   * Parse attribution annotation from a Decision field string.
   *
   * Tristate — three epistemically distinct outcomes:
   *   "[influenced-by: THINK-abc123]" → {declared: true,  proposals: ["THINK-abc123"]}  attributed
   *   "[influenced-by: none]"         → {declared: true,  proposals: []}                declared non-influence
   *   (no annotation)                 → {declared: false, proposals: []}                undeclared
   *
   * Undeclared ≠ non-influenced. Absence of declaration is an observability gap,
   * not an epistemic claim. Do not conflate with declared non-influence.
   */
  static parseAttribution(decisionText: string): { declared: boolean; proposals: string[] } {
    const influenced = decisionText.match(/\[influenced-by:\s*([^\]]+)\]/);
    if (influenced) {
      const raw = influenced[1].trim();
      if (raw === 'none') {
        return { declared: true, proposals: [] };
      }
      return { declared: true, proposals: raw.split(',').map(s => s.trim()).filter(Boolean) };
    }
    return { declared: false, proposals: [] };
  }

  private async currentState(): Promise<Map<string, ReflectDecision>> {
    let raw: string;
    try {
      raw = await this.fileSystem.readFile(`${this.rootPath}/${DECISION_PATH}`);
    } catch {
      return new Map();
    }

    const records = raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as RawRecord);
    const decisions = new Map<string, ReflectDecision>();
    const superseded = new Set<string>();

    for (const r of records) {
      if (isUpdate(r)) {
        superseded.add(r.decision_id);
      } else {
        decisions.set(r.decision_id, r);
      }
    }

    const result = new Map<string, ReflectDecision>();
    for (const [id, decision] of decisions) {
      result.set(id, superseded.has(id) ? { ...decision, finality: 'superseded' } : decision);
    }
    return result;
  }
}
