import { randomUUID } from 'node:crypto';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { DecisionOutcome, ReflectDecision } from '../../domain/models/reflect-decision.js';

const DECISION_PATH = '.arch/reflect-decisions.jsonl';

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
      influence_declared: params.influence_declared,
      based_on_proposals: params.based_on_proposals,
    };
    await this.fileSystem.appendFile(`${this.rootPath}/${DECISION_PATH}`, JSON.stringify(decision) + '\n');
    return decision;
  }

  async all(): Promise<ReflectDecision[]> {
    try {
      const raw = await this.fileSystem.readFile(`${this.rootPath}/${DECISION_PATH}`);
      return raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as ReflectDecision);
    } catch {
      return [];
    }
  }

  async forTarget(target: string): Promise<ReflectDecision[]> {
    const all = await this.all();
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
}
