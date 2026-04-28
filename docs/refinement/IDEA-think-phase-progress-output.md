# IDEA: THINK phase progress output in terminal
**Created:** 2026-04-28
**Source:** THINK Phase 3 Kaizen — conduct appears silent/stuck after the first banner line
**Status:** DRAFT
**Meta:** P2 | XS | 7-operations | scripts/arch.sh, docs/agents/THINK.md

## Problem
After `arch conduct` prints its banner, the terminal goes silent for the entire duration of the THINK run. Users perceive this as the process being stuck — the same failure mode that triggered TASK-082. There is no visibility into which phase is executing or whether the agent is making progress.

## Proposed solution
Print a `[THINK] Phase N — <name>` header to stdout before each phase begins. The agent already follows the four-phase protocol sequentially; adding a `echo` before each phase in the protocol instruction is enough to produce visible milestones:

```
  ARCH — invoking CONDUCTOR mode (THINK)
[THINK] Phase 1 — System Check
[THINK] Phase 2 — Idea Refinement
[THINK] Phase 3 — Continuous Kaizen
[THINK] Phase 4 — Autonomous Replenishment
[THINK] Done
```

Implementation: add explicit print instructions at the top of each phase section in `docs/agents/THINK.md`.

## Dependencies
None.

## Estimated size
XS

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
