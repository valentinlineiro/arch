# IDEA: Andon Cord — define loop halt conditions and stop behavior
**Created:** 2026-04-30
**Source:** Autonomous loop architecture — safety precondition for arch loop; a loop without defined failure-stops is unsafe
**Status:** DRAFT
**Meta:** P0 | S | local | docs/agents/DO.md, docs/GOVERNANCE.md, docs/INBOX.md

## Problem
Any autonomous execution loop must have explicit, machine-checkable conditions under which it stops and yields to a human. Without these, a runaway agent can commit a chain of incorrect changes before anyone notices. This is the Andon Cord from the Toyota Production System: any worker (agent) can halt the line when something is wrong.

## Proposed solution
Define three Andon Cord conditions in `docs/agents/DO.md` and `docs/GOVERNANCE.md`:

**Condition 1 — Review Failure Loop:** If `arch review` returns violations on the same task for 3 consecutive attempts, the agent halts, writes an `ANDON_HALT` entry to INBOX with the violation log, and stops the loop. It does not attempt a 4th fix without human input.

**Condition 2 — Budget Exceeded:** If a task's turn count exceeds the Muri threshold for its declared size (from `arch.config.json` `contextBudget`), the agent halts and flags the task as a potential sizing error in INBOX.

**Condition 3 — ADR Required:** If the implementation of any task would require touching a `protectedPath` (from IDEA-immutability) or introduces a MAJOR change, the agent halts and escalates to INBOX before writing a single line of code.

**Stop behavior for all conditions:** halt loop → append typed `ANDON_HALT` entry to `docs/INBOX.md` → commit halt state → exit. Loop resumes only when human writes `APPROVE` or `REDIRECT: instruction` in INBOX.

## Dependencies
IDEA-immutability-protected-paths-review-check (Condition 3 references protectedPaths).

## Estimated size
S

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
