# IDEA: Feature branch workflow — fully automatic branch-per-task execution
**Created:** 2026-05-05
**Source:** Human proposal — current single-branch model prevents parallel task isolation and worktree-based tooling
**Status:** REJECTED
**Meta:** P2 | M | claude | docs/agents/DO.md, arch.config.json, cli/src/main/ts/

## Problem
ARCH executes all tasks directly on `main` with atomic commits. This prevents isolated execution (e.g. worktrees per task), makes parallel task execution risky, and is incompatible with superpowers subagent-driven-development which requires feature branches. PR-based review workflows are also unavailable.

## Proposed solution
Automate a feature branch lifecycle per task, transparent to the agent:

1. `arch task start TASK-XXX` creates and checks out `task/TASK-XXX` branch automatically.
2. Implementation commits land on the task branch.
3. `arch task review TASK-XXX` pushes the branch and opens a PR (or fast-forwards to main for non-PR workflows).
4. On `REVIEW_PASS`, the Auditor merges via `--squash` or `--ff` and deletes the branch.

Branch naming: `task/TASK-XXX` (deterministic, no slug needed).
Merge strategy: configurable in `arch.config.json` (`squash` | `ff-only` | `merge`), default `ff-only`.

## Dependencies
None.

## Estimated size
M

## Gaps
- Decide merge strategy default and whether it's per-task-class or global.
- Define behavior when the task branch diverges from main before merge (rebase vs. merge commit).
- Decide whether PRs are optional (local merge only) or required (forces GitHub/GitLab workflow).

## Decision
REJECT: Out of scope, premature, or superseded by existing implementation.

## Decision
REJECT: Significant complexity increase. Premature until parallel agent use is validated.
