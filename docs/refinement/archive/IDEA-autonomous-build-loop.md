# IDEA: autonomous-build-loop — full autonomous project build: spec → running software
**Created:** 2026-05-24
**Source:** Strategic — Reading B: ARCH autonomously builds a project from a high-level spec
**Status:** DEFERRED
**Meta:** P1 | XL | human | docs/, cli/, arch.config.json

## Problem

Building Reading B requires three things working together:
1. `arch project init` — spec to ADR+task graph (IDEA-project-scaffold)
2. Project DoD gate — termination oracle (IDEA-project-dod-gate)  
3. The full execution loop: govern → focus → exec → archive → govern

These three exist or are being built. The gap is the integration: a single `arch build "<spec>"` command that runs the full autonomous cycle with human checkpoints at the right places.

## Proposed Solution

`arch build "<spec>" [--interactive]`

**Phase 1 — Scaffold (always interactive):**
```
arch build "restaurant OS: menu, analytics, orders"
→ arch project init (LLM decomposes spec)
→ Human reviews ADRs + task graph
→ Human confirms: "proceed" / "edit" / "abort"
```

**Phase 2 — Execute (can be autonomous):**
```
→ arch task loop --until-project-complete
  → govern (deterministic): assigns focus, archives done tasks
  → exec (LLM): implements focused task
  → govern: checks PROJECT.md DoD predicates
  → loop until PROJECT_COMPLETE or ANDON_HALT
```

**Phase 3 — Completion:**
```
→ PROJECT_COMPLETE → exit 2
→ Summary written to docs/RETRO.md
→ Optional: arch build --publish (generates handoff doc)
```

**Human checkpoints:**
- After Phase 1 (always) — human ratifies the task graph
- On ANDON_HALT — human resolves before loop resumes
- On M/L task Hansei — wizard runs, human may intervene

**The restaurant OS example would look like:**
```
$ arch build "restaurant OS: menu management, order tracking, revenue analytics"
  Decomposing spec...
  Generated: 4 ADRs, 23 tasks, 3 milestones
  
  Review docs/PROJECT.md and docs/tasks/ — then:
  $ arch build --continue
  
  [loop starts]
  Tick 1: TASK-001 IN_PROGRESS (menu schema)
  Tick 2: TASK-001 DONE, TASK-002 IN_PROGRESS (menu CRUD API)
  ...
  Tick 31: PROJECT_COMPLETE — all DoD predicates pass
```

## Constraint Axes
- Dependency ordering: Requires IDEA-project-scaffold + IDEA-project-dod-gate
- Temporal validity: Valid after those two ship — not before
- Abstraction layer: New `build` command, wires existing primitives
- Observability validity: Every step is an existing deterministic gate or LLM advisory
- Priority displacement: P1 — this is the strategic ceiling of ARCH v2

## Gaps
- Long-running processes: a 23-task restaurant OS takes hours. `arch build --continue` must be resumable from any checkpoint without re-reading the full context.
- LLM quality gate: if the LLM implementation of a task is wrong, govern can't detect it without running tests. PROJECT.md DoD predicates are the only safety net.
- Multi-session: the build may span multiple days. `.arch/build-state.json` needed to track phase and current position.

## Decision
DEFERRED: dependency ordering — requires TASK-1006 and TASK-1007 to be DONE first. Revisit after both ship.
