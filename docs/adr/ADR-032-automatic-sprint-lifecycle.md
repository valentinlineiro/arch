# ADR-032: Automatic sprint lifecycle in arch govern

**Date:** 2026-05-24
**Status:** Accepted
**Deciders:** Valen (human)
**Source:** TASK-957 — automatic sprint lifecycle

## Context

Sprint lifecycle (close retro, open next) required manual edits to `arch.config.json` and `docs/RETRO.md`. The sprint model (`Sprint`, `SprintService`, ADR-031) now provides a stable state machine. This ADR authorises wiring it into `arch govern`'s deterministic loop.

## Decision

`arch govern` automatically closes the current sprint and opens the next when `N` tasks have been archived since the sprint opened, where `N = arch.config.json.sprintCloseAfterN` (default: 15).

**arch.config.json schema additions:**
- `sprintCloseAfterN: number` — tasks-archived threshold (default 15)
- `sprintAutoNamePrefix: string` — prefix for auto-generated sprint names (default `"sprint/v"`)

**On sprint close:**
1. `SprintService.closeCurrent(velocity)` — writes to `.arch/sprint-state.json`, appends `SPRINT_CLOSE` to `.arch/focus-ledger.jsonl`
2. Deterministic retro entry appended to `docs/RETRO.md`: sprint name, open date, close date, velocity (task count)
3. `SprintService.openNext(name)` — derives next name from `cli/package.json` version + YYYY-MM suffix
4. `arch.config.json.currentSprint` updated to new sprint name

**Trigger:** count of archived tasks with `Closed-at` >= sprint `startedAt`. Idempotent — if sprint is not ACTIVE, no-op.

**What govern does NOT do:**
- Does not modify task content
- Does not generate THINK commentary for the retro (advisory only, remains manual)
- Does not block if `docs/RETRO.md` is missing (creates it)

## Consequences

- Sprint is now a first-class lifecycle entity managed by govern, not a human-maintained string
- `docs/RETRO.md` becomes a deterministic projection, not a freeform document
- THINK phase may augment the retro with commentary, but never overwrites the deterministic fields
- `sprintCloseAfterN` is the single configurable knob — teams running faster or slower adjust this
