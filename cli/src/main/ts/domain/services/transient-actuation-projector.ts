import type { Phase2WindowOutput, TransientOperationalSignal } from '../models/ontology.js';

export class TransientActuationProjector {
  /**
   * Pure, stateless projection of Phase 2 window hypotheses into instantaneous 
   * batch-bound operational signals (Phase 3).
   *
   * Enforces zero memory state, zero temporal prior smoothing, and strictly 
   * execution-scoped mapping.
   */
  public static project(windowOutputs: Phase2WindowOutput[]): TransientOperationalSignal {
    const observations: string[] = [];
    const alerts: { severity: 'INFO' | 'WARN'; message: string }[] = [];

    for (const w of windowOutputs) {
      if (w.hypotheses.length === 0) {
        continue;
      }

      // Sort hypotheses descending by confidence (should already be sorted, but enforce it)
      const sorted = [...w.hypotheses].sort((a, b) => b.confidence - a.confidence);
      const dominant = sorted[0];

      // Add descriptive observation
      observations.push(
        `Window ${w.window_id}: Dominant typology = ${dominant.interpretation_type} (confidence: ${dominant.confidence.toFixed(2)})`
      );

      // Rule-based, stateless projection to local operational alerts
      if (dominant.interpretation_type === 'unclassified_drift' && dominant.confidence >= 0.35) {
        alerts.push({
          severity: 'WARN',
          message: `High unclassified drift in window ${w.window_id} (confidence: ${dominant.confidence.toFixed(2)}). Potential structural misalignment.`,
        });
      } else if (dominant.interpretation_type === 'structural_configuration' && dominant.confidence >= 0.4) {
        alerts.push({
          severity: 'INFO',
          message: `Significant structural configuration activity in window ${w.window_id} (confidence: ${dominant.confidence.toFixed(2)}).`,
        });
      } else if (dominant.interpretation_type === 'environmental_alignment' && dominant.confidence >= 0.4) {
        alerts.push({
          severity: 'INFO',
          message: `Environmental alignment activity detected in window ${w.window_id} (confidence: ${dominant.confidence.toFixed(2)}).`,
        });
      } else if (dominant.interpretation_type === 'syntactic_refinement' && dominant.confidence >= 0.4) {
        alerts.push({
          severity: 'INFO',
          message: `Syntactic refinement activity in window ${w.window_id} (confidence: ${dominant.confidence.toFixed(2)}).`,
        });
      }

      // Detect high interpretive ambiguity between top competing hypotheses
      if (sorted.length >= 2) {
        const runnerUp = sorted[1];
        const diff = dominant.confidence - runnerUp.confidence;
        if (diff <= 0.1 && dominant.interpretation_type !== 'empty_observational_span') {
          alerts.push({
            severity: 'WARN',
            message: `High interpretive ambiguity in window ${w.window_id} between "${dominant.interpretation_type}" and "${runnerUp.interpretation_type}" (diff: ${diff.toFixed(2)}).`,
          });
        }
      }
    }

    return {
      signal_type: 'local_projection',
      window_scope: 'current_run_only',
      observations,
      alerts,
    };
  }
}
