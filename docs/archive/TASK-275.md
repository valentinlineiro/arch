## TASK-275: Implement adaptive planning - human-state qualifiers for task status
**Meta:** P3 | S | DONE | Focus:no | 6-writing | claude | docs/TASK-FORMAT.md, docs/guidelines/
**Closed-at:** 2026-06-02T05:27:43.991Z

### Context

ARCH task statuses model pipeline state but not human state. A task can be technically READY but unreachable due to cognitive bandwidth, energy, or context load. This task extends the task status vocabulary with optional human-state qualifiers and integrates them into `arch next` with an optional `--energy` flag.

### Acceptance Criteria

- [x] `docs/TASK-FORMAT.md` documents the optional human-state qualifiers (`READY/high-cost`, `READY/context-heavy`, `BLOCKED/energy`, `READY/maintenance`) with usage guidance.
- [x] `arch next` accepts an optional `--energy low|medium|high` flag and filters/sorts suggestions accordingly.
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] Human-state qualifiers documented in TASK-FORMAT.md and integrated into arch next.
- [x] `arch review` passes.

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** REJECTED. Human-state qualifiers (energy levels, emotional state, focus modes) are misaligned with ARCH direction. ARCH governs work structure, not human state. Injecting human-state signals into the task priority model adds subjectivity and undermines the deterministic governance guarantee. The problem this task addressed (poor task selection when the human is tired) is better solved by the operator choosing not to run arch govern.
**Constraint:** Rejection is final. If pilot data shows human-state signals improve outcomes measurably, re-file as a new IDEA with evidence.
**Cost:** No implementation cost — task rejected before any work.
**Forward Action:** None. If human state signals become relevant, file a new IDEA with concrete evidence from real usage.
