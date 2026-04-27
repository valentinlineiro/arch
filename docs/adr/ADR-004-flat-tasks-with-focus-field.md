# ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split

**Date:** 2026-04-27
**Status:** ACCEPTED
**Deciders:** Valentín Liñeiro

---

## Context
ARCH maintained two directories — `docs/tasks/sprint/` and `docs/tasks/backlog/` — to separate active work from queued work. With continuous Kaizen (THINK Phase 3), bugs going directly to sprint, and sprint planning becoming ad-hoc, the boundary collapsed in practice: the human routinely moved all backlog tasks to sprint in a single operation. The two-directory model created duplication risk (same task referenced in two places) and added cognitive overhead for every new task ("sprint or backlog?").

## Decision
Merge `docs/tasks/sprint/` and `docs/tasks/backlog/` into a single `docs/tasks/` directory. Add a `Focus: yes/no` field to the Meta line of each task to distinguish active work (`yes`) from queued work (`no`). The archive directory remains unchanged.

## Rationale
- **Single source of truth:** one file, one location — structural duplication is impossible.
- **Focus as intent, not location:** the agent reads `Focus:yes` tasks as the active queue; `Focus:no` tasks are context for planning. Same semantic, zero duplication risk.
- **Continuous flow compatible:** adding or removing focus is a one-field edit, not a file move. Matches the ad-hoc cadence of continuous Kaizen.
- **Velocity preserved:** `Closed-at:` field (ADR companion, TASK-014) enables weekly throughput metrics without sprint boundaries.

Alternatives considered:
- **Keep sprint/backlog split with stricter discipline:** rejected — the collapse happened organically, discipline alone won't fix a structural problem.
- **Single flat list, no Focus field:** rejected — the agent needs a signal to bound its context reads per session.

## Consequences

**Positive:**
- Eliminates the "sprint vs backlog" decision on every new task.
- `arch review` Paths check becomes simpler — one directory to validate.
- Task creation, movement, and archiving all operate on one location.

**Negative / trade-offs:**
- CLI (`MarkdownTaskRepository`) must be updated to read from `docs/tasks/` and parse the `Focus` field.
- All existing task files require a Meta line migration (add `Focus:yes` or `Focus:no`).
- `arch.config.json` paths and agent protocol docs must be updated.
- Sprint velocity metrics shift from "tasks per sprint number" to "tasks per week" — requires updating METRICS.md template.

---
<!-- Once ACCEPTED, this ADR is permanent. -->
<!-- To reverse: create a new ADR that supersedes this one. -->
<!-- Reference in tasks: ADR-004 — no need to re-read, decision is final -->
