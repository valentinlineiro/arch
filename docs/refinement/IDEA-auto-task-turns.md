# IDEA: Automatic task turn counter — auto-increment Turns on commit

**Status:** DRAFT
**Created:** 2026-06-02
**Source:** THINK replenishment — archived tasks show `Turns: 0` for all tasks (no automatic tracking)
**Candidate-class:** 7-operations
**Candidate-size:** S

## Problem

ARCH tracks `**Turns:** N` in task Meta lines as a complexity metric for Mura detection and sprint analytics. Every archived task examined shows `Turns: 0` because there is no mechanism to increment the counter. The turn counter is manually set or never updated — both outcomes produce the same result: zero data. Mura detection, sprint metrics, and cost-per-turn calculations are all based on `Turns: 0`.

## Proposed solution

Add a lightweight auto-increment mechanism:

1. A git `post-commit` hook (`.githooks/post-commit`) or a script called by the commit flow
2. On each commit that modifies a file in `docs/tasks/`, parse the task file for `**Turns:** (\d+)` and increment the number by 1
3. Amend the commit with the updated Turns value (or stage the change in a follow-on commit)

**Alternative lightweight approach:** Modify the task status transition flow (e.g., in `core-flows.md` or the CLI status change handler) to auto-increment `Turns` when a task is committed to. This avoids git hooks entirely.

## Validation hints

- Commit to `docs/tasks/TASK-1080.md` (any non-AC change); verify Turns increments from current value
- Archived tasks with `Turns: 0` remain unchanged (forward-only)
- `arch review` passes
- `npm test` passes

## Dependencies

None — purely operational, no ADR required.

## Sessions: 1

## Decision

EXTEND. The post-commit hook approach would count govern ticks, THINK regenerations, and lint-fix commits as turns — inflated noise, not signal. Gap: define precisely what constitutes a turn before implementing. A turn is one agent working session on a task: increment on IN_PROGRESS commit (task start) and on REVIEW commit (task submission), not on any file touch. Trigger: spec added to this IDEA defining the two increment points and the CLI path that owns the increment (status transition handler in mark-task-in-progress / mark-task-done, not a git hook).

