# IDEA: arch loop — autonomous execution engine (THINK → GOVERN → EXEC → REVIEW → ARCHIVE)
**Created:** 2026-04-30
**Source:** Autonomous loop architecture — move human from Operator to Governor
**Status:** DRAFT
**Meta:** P1 | L | local | cli/src/, docs/agents/DO.md, docs/agents/THINK.md, arch.config.json

## Problem
The current ARCH flow requires the human to trigger every phase manually: `arch conduct`, `arch govern`, `arch exec`. Between each command the loop is broken. The human is acting as Operator (keeping the machine running) rather than Governor (approving strategic decisions). This caps throughput to the human's availability and attention.

## Proposed solution
Implement `arch loop` as a CLI command that runs the full cycle autonomously:

```
THINK (assess) → GOVERN (select) → EXEC (implement) → REVIEW (verify) → ARCHIVE (commit) → repeat
```

**Cycle behavior:**
1. Run `arch govern` — selects focused task; if no READY tasks, runs `arch conduct` (THINK) first.
2. Run `arch exec` — executes focused task to REVIEW state.
3. Run `arch review` — if passes, archive task and continue. If fails, increment failure counter.
4. On Andon Cord condition: write to INBOX, halt, exit.
5. On human checkpoint required (IDEA promotion, merge gate): write to INBOX, pause, poll until resolved, resume.

**Loop scope flags:**
- `arch loop` — run until Andon Cord or INBOX block
- `arch loop --sprint <slug>` — scope to tasks tagged with the sprint (L3 foundation)
- `arch loop --dry-run` — plan only, no commits

**Implementation:** thin CLI wrapper over existing `govern`, `conduct`, and `exec` commands. The loop logic lives in a new `LoopEngine` use case in `cli/src/main/ts/application/use-cases/`.

## Dependencies
- IDEA-andon-cord (required before implementation — safety precondition)
- IDEA-inbox-regeneration-protocol (INBOX is the pause/resume mechanism)

## Estimated size
L

## Gaps
- Define polling mechanism for INBOX: does the loop actively poll INBOX.md for human responses, or does it halt and require a manual `arch loop --resume`?
- Clarify interaction with `arch exec` — does loop call exec as a subprocess or inline?

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
