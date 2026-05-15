## TASK-254: Audit THINK phases for structural necessity vs. optional analysis
**Meta:** P2 | S | READY | Focus:no | 6-writing | claude | docs/agents/THINK.md, docs/adr/

### Context

`docs/agents/THINK.md` currently runs replenishment, refinement, semantic drift detection, weak-signal decay, governance boundary audit, kaizen, metrics, and bi-weekly revision in a single mode. The protocol is valuable but undifferentiated — every invocation pays the full cost.

Codex identified the distinction: some phases produce structural guarantees (if skipped, the system's integrity degrades); others are valuable but deferrable (analysis that improves decisions but doesn't break anything if omitted); others are primarily cognitive overhead (ceremony that exists for consistency but has no enforcement teeth).

This task produces a classification document — not code changes. Its output is the basis for a future THINK simplification task.

### Acceptance Criteria

- [ ] A classification document is written at `docs/agents/THINK-audit.md` that lists every THINK phase with its classification: `structural` / `deferrable` / `overhead`.  →  file: docs/agents/THINK-audit.md
- [ ] Each classification includes a one-sentence rationale: what breaks (or doesn't) if the phase is skipped.  →  prose: verified by reading THINK-audit.md rationale column
- [ ] The document identifies which phases are candidates for `arch improve --deep` (deferrable) vs. the default THINK loop (structural only).  →  prose: verified by reading THINK-audit.md recommendation section
- [ ] Weak-signal decay and governance boundary audit are explicitly classified with rationale — these were flagged as potentially load-bearing in session analysis.  →  prose: verified by reading those specific entries
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [ ] `docs/agents/THINK-audit.md` exists and is complete (all current THINK phases classified).
- [ ] A human has reviewed the classifications and confirmed or corrected them before this task moves to DONE.  →  prose: human review confirmed
