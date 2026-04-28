# IDEA: Auto-create P0 bug task when arch review fails
**Created:** 2026-04-28
**Source:** Human request — review failures should self-document and self-prioritize
**Status:** DRAFT
**Meta:** P1 | S | 2-code-generation | cli/src/, scripts/arch.sh

## Problem
When `arch review` fails, the violations are printed to the terminal and immediately forgotten. The human must manually remember to create a bug task, assign it P0, and describe the failure. If they don't, the system drifts silently — review continues failing on every run with no tracked resolution.

## Proposed solution
When `arch review` exits with a non-zero status, automatically create a `P0 | XS | READY` bug task in `docs/tasks/` that captures the exact violations reported.

### Behaviour
1. `arch review` runs as today.
2. If it **passes** → no change.
3. If it **fails** → before exiting, the CLI (or `arch.sh`) creates a task file:
   - ID: next available `TASK-XXX`
   - Title: `Fix arch review violations`
   - Priority: **P0** (maximum)
   - Size: XS (violations are small targeted fixes)
   - Status: READY, Focus:yes
   - AC: one checkbox per violation line reported by the reviewer
4. The task file is committed atomically with a conventional prefix (`fix:`) and a `[TASK-XXX]` reference.
5. If a `Fix arch review violations` task already exists and is READY/IN_PROGRESS, skip creation and print its ID instead (no duplicates).

### Implementation options
- **Option A — CLI** (`ReviewCommand`): after collecting violations, if any exist, call a `CreateBugTaskUseCase` before printing the summary. Cleanest; no shell needed.
- **Option B — arch.sh**: wrap `$BIN review` in a subshell, capture exit code, call a `arch task create-bug` subcommand on failure. Keeps the Node CLI simpler.

Option A is preferred: the CLI already knows the violation list as structured data.

## Dependencies
- Requires next-task-id resolution logic (already exists in `MarkdownTaskRepository` implicitly via file naming).

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
