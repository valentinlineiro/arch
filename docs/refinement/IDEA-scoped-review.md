# IDEA: arch review --task TASK-XXX — scoped Auditor review
**Created:** 2026-05-17
**Source:** Session observation — Auditor sessions load everything to verify one task
**Status:** DRAFT
**Sessions:** 0
**Meta:** P1 | S | 2-code-generation | cli/src/main/ts/application/commands/review-command.ts, cli/src/main/ts/application/use-cases/review-system.ts

## Problem

`arch review` runs all 24 DriftChecker checks against the full system. For an Auditor session verifying a single task in REVIEW, this loads irrelevant context (archive integrity, merge commits, UnappliedADRs) when only the task-specific checks matter. On large repos this is expensive. More importantly: the Auditor's job is to verify ACs, not to run a system audit.

The current review output also doesn't call out which specific ACs passed or failed for the task under review — the DeterministicACVerifier runs inside `arch task done`, not `arch review`. An Auditor has no way to see the evidence table without triggering DONE.

## Proposed Solution

`arch review --task TASK-XXX` — scoped review for Auditor use:

1. Verify all `cmd:` and `file:` predicates in the task's ACs (DeterministicACVerifier)
2. Validate Hansei completeness (HanseiWizard.isHanseiComplete)
3. Check task meta line compliance (TaskTemplateCompliance for this task only)
4. Emit per-AC evidence table: `[cmd] AC description: exit 0 ✔` or `[file] path: exists ✔`
5. Exit 0 if all pass, exit 1 if any fail — scriptable

Full system review (`arch review` with no args) is unchanged.

**L3 trust improvement:** `arch review --task TASK-XXX` passing before `arch task done` makes L3 self-archive more auditable. The evidence table is the audit record.

## Constraint Axes
- Dependency ordering: None
- Temporal validity: Valid now
- Abstraction layer: Correct — read-only, no state mutation
- Observability validity: Fully deterministic
- Priority displacement: P1 — directly improves Auditor ergonomics and L3 trustworthiness

## Decision
<!-- PROMOTE → TASK-XXX | REJECT: reason | DEFERRED: reason + condition -->
