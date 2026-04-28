# IDEA: Guarded `arch task done` transition
**Created:** 2026-04-28
**Source:** KAIZEN-LOG.md (drift detection latency)
**Status:** DRAFT
**Meta:** P2 | S | cli | cli/src/main/ts/application/commands/task-command.ts

## Problem
Currently, `arch task done TASK-XXX` changes the task status to `DONE` and archives it without verifying if the task is actually valid (e.g., all Acceptance Criteria checked). Drift is only detected during a subsequent `arch review`, creating a latency where the archive can contain invalid state.

## Proposed solution
Integrate a validation gate into the `arch task done` command. The command should:
1. Load the task.
2. Run the `Reviewer` logic on it.
3. If violations exist (e.g., unchecked ACs), block the status transition and report the violations to the user.
4. Allow a `--force` flag for exceptional cases.

## Dependencies
None

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
