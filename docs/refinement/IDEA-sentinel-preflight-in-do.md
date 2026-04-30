# IDEA: Add pre-flight constraint check to DO mode (SENTINEL)
**Created:** 2026-04-30
**Source:** Human proposal (SENTINEL protocol) — DO mode has no pre-task validation step before implementation begins
**Status:** DRAFT
**Meta:** P2 | S | local | docs/agents/DO.md, arch.config.json

## Problem
DO mode jumps directly from "find highest priority READY task" to implementation. There is no step where the agent checks whether the planned approach violates known constraints before writing any code. Violations are only caught by `arch review` after the commit is made.

## Proposed solution
Add a pre-flight step to DO.md Intent: Execute Task, between step 2 (select task) and step 3 (set IN_PROGRESS):

**Pre-flight:** Before locking the task, verify against a short negative constraint list defined in `arch.config.json`:

```json
"negativeConstraints": [
  "Do not add npm dependencies for tasks smaller than M",
  "Do not modify protectedPaths without a linked ADR",
  "Do not introduce new CLI commands without updating docs/agents/"
]
```

If the task's ACs or description would require violating a constraint, the agent must pause and escalate to INBOX before proceeding. This keeps the constraint list visible, versioned, and human-editable — not buried in a protocol file.

## Dependencies
IDEA-immutability-protected-paths-review-check (shares `protectedPaths` config concept).

## Estimated size
S

## Gaps
- **Check Mechanism:** The pre-flight check is performed by an XS reasoning call (Haiku or similar) that takes the task's ACs + description and the `negativeConstraints` list. It returns PASS or FAIL with justification.
- **Placement:** This check happens in DO mode *after* the task is read but *before* the first tool call or file edit. It acts as a cognitive "wait, am I allowed to do this?" step.
- **Bypassing:** A `force: yes` field on a task can bypass the Sentinel check for emergency hotfixes.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
