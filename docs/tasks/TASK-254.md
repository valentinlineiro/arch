## TASK-254: Audit THINK phases for structural necessity vs. optional analysis
**Meta:** P2 | S | DONE | Focus:no | 6-writing | claude | docs/agents/THINK.md, docs/adr/
**Closed-at:** 2026-05-15T00:00:00Z

### Context

`docs/agents/THINK.md` currently runs replenishment, refinement, semantic drift detection, weak-signal decay, governance boundary audit, kaizen, metrics, and bi-weekly revision in a single mode. The protocol is valuable but undifferentiated — every invocation pays the full cost.

Codex identified the distinction: some phases produce structural guarantees (if skipped, the system's integrity degrades); others are valuable but deferrable (analysis that improves decisions but doesn't break anything if omitted); others are primarily cognitive overhead (ceremony that exists for consistency but has no enforcement teeth).

This task produces a classification document — not code changes. Its output is the basis for a future THINK simplification task.

### Acceptance Criteria

- [x] A classification document is written at `docs/agents/THINK-audit.md` that lists every THINK phase with its classification: `structural` / `deferrable` / `overhead`.  →  file: docs/agents/THINK-audit.md
- [x] Each classification includes a one-sentence rationale: what breaks (or doesn't) if the phase is skipped.  →  prose: verified by reading THINK-audit.md rationale column
- [x] The document identifies which phases are candidates for `arch improve --deep` (deferrable) vs. the default THINK loop (structural only).  →  prose: verified by reading THINK-audit.md recommendation section
- [x] Weak-signal decay and governance boundary audit are explicitly classified with rationale — these were flagged as potentially load-bearing in session analysis.  →  prose: verified by reading those specific entries
- [x] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [x] `docs/agents/THINK-audit.md` exists and is complete (all current THINK phases classified).
- [x] A human has reviewed the classifications and confirmed or corrected them before this task moves to DONE.  →  prose: human review confirmed 2026-05-15 — all three open questions resolved, decisions recorded in THINK-audit.md

## Hansei
**Severity:** H0
**Category:** [MissingDecisionRecord]

**Decision:**
Classification produced three open questions that couldn't be resolved from the protocol text alone: weak signal decay frequency when Phase 2.5 is deferred, whether Phase 3 "Immediate Improvements" is providing signal or noise, and whether arch report needs a lighter trigger outside the deep loop. These are surfaced in the audit document rather than resolved unilaterally.

**Constraint:**
The audit is based on reading the protocol text, not on observing actual THINK session outputs. The "overhead" classification for Phase 3 Step 3 is a structural observation, but empirical confirmation requires hansei-category-log data that doesn't exist yet.

**Cost:**
The open questions delay the THINK simplification task until a human reviews and decides on them. This is intentional — the audit is pre-work, not a decision.

**Forward Action:**
TASK-255 and TASK-256 implement the audit recommendations. If the DEFAULT/DEEP split proves stable after 10+ sessions, consider an ADR update to canonicalize the phase classification.
