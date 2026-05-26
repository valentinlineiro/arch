import type { CausalSignalLog } from '../../application/use-cases/causal-signal-log.js';
import type { Hansei } from '../models/task.js';

// Minimum occurrences of the same category in a module before a weak signal fires
export const WEAK_SIGNAL_THRESHOLD = 3;

export interface HanseiSignalContext {
  taskId: string;
  title: string;
  hansei: Hansei;
  module?: string; // e.g. 'cli/src/main/ts/domain/' extracted from context paths
}

export class SignalRouter {
  constructor(private causalSignalLog: CausalSignalLog) {}

  /**
   * Called on task completion. Routes H2 and H3 Hansei signals to the causal graph.
   * H0/H1 are informational only — not routed.
   */
  async route(ctx: HanseiSignalContext): Promise<void> {
    const { hansei, taskId } = ctx;

    if (hansei.severity === 'H0' || hansei.severity === 'H1') return;

    if (hansei.severity === 'H2') {
      await this.causalSignalLog.append({
        domain: 'epistemological',
        signal_type: 'create',
        candidate_from: taskId,
        candidate_relation: 'causes' as any,
        candidate_to: `friction:${hansei.category}`,
        confidence: 0.6,
        event: `hansei_signal:${taskId}:H2`,
      });
    }

    if (hansei.severity === 'H3a' || hansei.severity === 'H3b') {
      await this.causalSignalLog.append({
        domain: 'normative',
        signal_type: 'create',
        candidate_from: taskId,
        candidate_relation: 'causes' as any,
        candidate_to: `risk:${hansei.category}`,
        confidence: 0.85,
        event: `hansei_signal:${taskId}:${hansei.severity}`,
      });
    }

    // Link Forward Action references to the causal graph
    const taskRefs = hansei.forwardAction.match(/TASK-\d+/g) ?? [];
    const ideaRefs = hansei.forwardAction.match(/IDEA-[\w-]+/g) ?? [];

    for (const ref of [...taskRefs, ...ideaRefs]) {
      await this.causalSignalLog.append({
        domain: 'ontological',
        signal_type: 'create',
        candidate_from: taskId,
        candidate_relation: 'spawned',
        candidate_to: ref,
        confidence: 0.7,
        event: `hansei_forward_action:${taskId}`,
      });
    }
  }
}

/**
 * Aggregates Hansei signals from the causal signal log into a category/module breakdown.
 * Returns entries where the count meets or exceeds the weak signal threshold.
 */
export interface HanseiAggregate {
  category: string;
  module: string;
  count: number;
  taskIds: string[];
  isWeakSignal: boolean;
}

export async function aggregateHanseiSignals(
  causalSignalLog: CausalSignalLog,
): Promise<HanseiAggregate[]> {
  const signals = await causalSignalLog.all();

  // Filter to Hansei-sourced signals
  const hanseiSignals = signals.filter(s =>
    s.event.startsWith('hansei_signal:') &&
    s.candidate_to.startsWith('friction:') || s.candidate_to.startsWith('risk:')
  );

  const counts = new Map<string, { taskIds: string[]; category: string; module: string }>();

  for (const signal of hanseiSignals) {
    const category = signal.candidate_to.replace(/^(friction|risk):/, '');
    // Module inferred from candidate_from task ID prefix — group by category for now
    const module = 'global';
    const key = `${category}::${module}`;

    if (!counts.has(key)) counts.set(key, { taskIds: [], category, module });
    counts.get(key)!.taskIds.push(signal.candidate_from);
  }

  return Array.from(counts.entries()).map(([, v]) => ({
    ...v,
    count: v.taskIds.length,
    isWeakSignal: v.taskIds.length >= WEAK_SIGNAL_THRESHOLD,
  })).sort((a, b) => b.count - a.count);
}
