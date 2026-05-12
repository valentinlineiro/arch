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
    based_on_proposals: string[];
  }): Promise<ReflectDecision> {
    const decision: ReflectDecision = {
      decision_id: `D-${randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      target: params.target,
      outcome: params.outcome,
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
   * Returns proposal IDs cited, or null if INDEPENDENT declared, or undefined if absent.
   *
   * "[influenced-by: THINK-abc123, THINK-def456]" → ["THINK-abc123", "THINK-def456"]
   * "[independent]"                                → []  (outcome = INDEPENDENT)
   * (no annotation)                                → undefined (attribution not declared)
   */
  static parseAttribution(decisionText: string): string[] | undefined {
    const influenced = decisionText.match(/\[influenced-by:\s*([^\]]+)\]/);
    if (influenced) {
      return influenced[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    if (/\[independent\]/i.test(decisionText)) {
      return [];
    }
    return undefined;
  }
}
