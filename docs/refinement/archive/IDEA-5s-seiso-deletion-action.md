# IDEA: 5S Seiso — arch review dead-path detection should propose deletion tasks
**Created:** 2026-04-30
**Source:** Human proposal (5S methodology) — arch review detects dead paths but never acts on them
**Status:** PROMOTED
**Meta:** P2 | S | local | cli/src/, docs/agents/THINK.md

## Problem
`arch review` DeadPaths check detects files referenced in protocols that no longer exist (and vice versa), but only emits a WARN. The detection is complete; the response is not. Dead artifacts accumulate until a human manually decides to delete them — the friction that kept `DISPATCH.md` alive for multiple sprints after its own deprecation notice.

## Proposed solution
When `arch review` emits a DeadPaths WARN, THINK Phase 1 should treat each unresolved WARN as a candidate for a Seiso (clean sweep) task. If the same DeadPaths WARN persists across 2 consecutive THINK sessions, automatically create a `chore` task in `docs/tasks/` with `Focus:no`, priority P3, size XS, proposing the specific deletion.

This closes the loop: detect → persist → auto-task → delete. No human intervention needed for obvious dead files.

## Dependencies
None — extends existing `arch review` + THINK Phase 1 flow.

## Estimated size
S

## Gaps

## Decision
PROMOTE → TASK-150
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
