/**
 * PHASE 1 — Syntactic Observation Layer
 * Ordered but semantically inert event trace.
 */
export interface Phase1Event {
  readonly event_id: string; // Time-blind sequence index (e.g. "0", "1", "2")
  readonly event_type: string; // e.g. "file_write", "process_event", "ci_event", "log_event"
  readonly attributes: {
    readonly raw_category: 'file_write' | 'process_event' | 'ci_event' | 'log_event';
    readonly exit_code?: number;
    readonly file_class: 'config_like' | 'code_like' | 'unknown';
    readonly metadata: Record<string, unknown>;
  };
}

/**
 * PHASE 2 — Local Hypothesis Generation Layer
 * Ephemeral, execution-scoped interpretations.
 */
export interface BoundedHypothesis {
  readonly interpretation_type: string; // Non-canonical operational typology description
  readonly supporting_events: string[]; // Sequence-index references only (event_id)
  readonly confidence: number; // Strictly bounded [0.0, 1.0]
}

export interface Phase2WindowOutput {
  readonly window_id: string; // ephemerally generated per run
  readonly hypotheses: BoundedHypothesis[];
}

/**
 * PHASE 3 — Stateless Projection Layer
 * Pure functional output over Phase 2 distributions.
 */
export interface TransientOperationalSignal {
  readonly signal_type: 'local_projection';
  readonly window_scope: 'current_run_only';
  readonly observations: string[];
  readonly alerts: {
    readonly severity: 'INFO' | 'WARN';
    readonly message: string;
  }[];
}

/**
 * Enforces absolute semantic blindness and prevents semantic leakage at ingestion.
 */
export class SyntacticValidationService {
  private static readonly BANNED_SEMANTIC_WORDS = new Set([
    'failure', 'drift', 'success', 'risk', 'quality', 'efficiency', 'issue'
  ]);

  /**
   * Scans event payload for qualitative or interpretive vocabulary.
   * Throws an error on discovery of any banned terms.
   */
  public static validateEvent(event: Phase1Event): void {
    const rawContent = JSON.stringify(event).toLowerCase();
    for (const banned of this.BANNED_SEMANTIC_WORDS) {
      if (rawContent.includes(banned)) {
        throw new Error(
          `[Epistemic Breach] Invariant violation: Event contains banned semantic term "${banned}"`
        );
      }
    }
  }
}
