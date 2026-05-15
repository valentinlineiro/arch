## TASK-256: Cut Phase 3 "Immediate Improvements" and add Kaizen evidence gate
**Meta:** P1 | S | DONE | Focus:no | 6-writing | claude | docs/agents/THINK.md
**Closed-at:** 2026-05-15T00:00:00Z
**Depends:** TASK-255

### Context

Phase 3 "Immediate Improvements" (THINK.md Phase 3 step 3) is an underspecified freeform observation step with no concrete trigger or output format. It is the step most prone to generating discretionary model spend — a session can emit observations without any grounding in repeated evidence.

Per the TASK-254 audit decision: cut "Immediate Improvements" as a named step. Fold the output rule into Phase 3 Kaizen Learning with a strict evidence gate: Kaizen output only when grounded in repeated evidence from phases 1–2.5 or metrics. No concrete trigger → no emission.

The change is to `docs/agents/THINK.md` only. No CLI changes required.

### Acceptance Criteria

- [x] `docs/agents/THINK.md` Phase 3 no longer contains "Immediate Improvements" as a named step or numbered item.  →  prose: verified by reading THINK.md Phase 3
- [x] Phase 3 Kaizen Learning includes an explicit evidence gate: an improvement proposal is only emitted when it can cite a concrete repeated signal from Phase 1, Phase 2, Phase 2.5, or `docs/METRICS.md`. Proposals without a cited signal are suppressed.  →  prose: verified by reading Kaizen Learning output rule in THINK.md
- [x] The evidence gate rule is stated as a single testable condition in THINK.md, not as narrative guidance.  →  prose: verified — rule is phrased as "only emit if [condition]", not "try to ground proposals"
- [x] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [x] THINK.md Phase 3 contains no step named "Immediate Improvements."
- [x] Kaizen output rule is a hard condition, not a soft guideline.
- [x] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** All acceptance criteria met: "Immediate Improvements" step removed, evidence gate added as a hard condition, steps renumbered sequentially, arch review passes with exit 0.
**Constraint:** Change scoped to docs/agents/THINK.md only; no CLI or enforcement layer was modified per spec.
**Cost:** Minimal — single file edit, no downstream breakage observed.
**Forward Action:** No follow-up required; evidence gate is self-contained and directly testable by reading Phase 3 Kaizen Learning.
