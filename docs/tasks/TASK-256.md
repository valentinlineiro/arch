## TASK-256: Cut Phase 3 "Immediate Improvements" and add Kaizen evidence gate
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 6-writing | claude | docs/agents/THINK.md
**Depends:** TASK-255

### Context

Phase 3 "Immediate Improvements" (THINK.md Phase 3 step 3) is an underspecified freeform observation step with no concrete trigger or output format. It is the step most prone to generating discretionary model spend — a session can emit observations without any grounding in repeated evidence.

Per the TASK-254 audit decision: cut "Immediate Improvements" as a named step. Fold the output rule into Phase 3 Kaizen Learning with a strict evidence gate: Kaizen output only when grounded in repeated evidence from phases 1–2.5 or metrics. No concrete trigger → no emission.

The change is to `docs/agents/THINK.md` only. No CLI changes required.

### Acceptance Criteria

- [ ] `docs/agents/THINK.md` Phase 3 no longer contains "Immediate Improvements" as a named step or numbered item.  →  prose: verified by reading THINK.md Phase 3
- [ ] Phase 3 Kaizen Learning includes an explicit evidence gate: an improvement proposal is only emitted when it can cite a concrete repeated signal from Phase 1, Phase 2, Phase 2.5, or `docs/METRICS.md`. Proposals without a cited signal are suppressed.  →  prose: verified by reading Kaizen Learning output rule in THINK.md
- [ ] The evidence gate rule is stated as a single testable condition in THINK.md, not as narrative guidance.  →  prose: verified — rule is phrased as "only emit if [condition]", not "try to ground proposals"
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [ ] THINK.md Phase 3 contains no step named "Immediate Improvements."
- [ ] Kaizen output rule is a hard condition, not a soft guideline.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0
