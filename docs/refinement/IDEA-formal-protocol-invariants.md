# IDEA: Formal protocol invariants — machine-provable guarantees in arch review
**Created:** 2026-04-30
**Source:** Strategic vision — some protocol properties should be provable, not just guideline-stated
**Status:** DRAFT
**Meta:** P2 | M | local | cli/src/, docs/GOVERNANCE.md, docs/guidelines/

## Problem
Critical protocol properties are stated as guidelines ("a task never moves from DONE to IN_PROGRESS without human approval") but are not machine-checked. `arch review` detects drift after the fact. There is no mechanism to prove that the current repository state satisfies all invariants — which matters for compliance, auditing, and trusting the loop at L3+.

## Proposed solution
Define a set of protocol invariants in `arch.config.json` as checkable predicates, verified by a new `arch review --invariants` pass:

```json
"invariants": [
  "no_task_regresses_from_done_without_adr",
  "every_protected_path_commit_has_adr_ref",
  "no_task_exceeds_budget_by_2x",
  "all_in_progress_tasks_have_lock",
  "no_two_tasks_focus_yes_simultaneously"
]
```

Each invariant is implemented as a deterministic CLI check. A violation is a P0 bug (per bugs.md protocol). The invariant set is versioned with the schema — adding a new invariant is a MINOR version bump; removing one is MAJOR.

Over time, this creates an auditable compliance record: `arch review --invariants` run on any commit in history tells you whether that commit satisfied all invariants at the time.

## Dependencies
IDEA-typed-protocol-schema (invariants are most naturally expressed over a typed schema).
IDEA-immutability-protected-paths-review-check (protectedPaths invariant is a direct extension).

## Estimated size
M

## Gaps
- Define the predicate language for invariants (custom DSL, JSON Logic, or TypeScript functions).
- Decide whether invariant violations halt the loop immediately (Andon Cord) or are reported as P0 bugs in the next THINK cycle.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
