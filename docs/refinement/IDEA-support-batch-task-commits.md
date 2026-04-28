# IDEA: Support batch task references in commit messages
**Created:** 2026-04-28
**Source:** KAIZEN-LOG — Batch lock commit fails TASK-ID validator
**Status:** DRAFT
**Meta:** P2 | XS | 7-operations | cli/src/main/ts/domain/services/reviewer.ts

## Problem
The `Reviewer.validateCommitMessage` rule requires exactly one `[TASK-XXX]` reference (or a `task:`/`idea:` prefix). When planning a sprint or performing a maintenance operation that affects multiple tasks, a single atomic commit cannot reference all of them without triggering a review failure.

## Proposed solution
Update the regex in `Reviewer.validateCommitMessage` to allow multiple TASK-IDs in the same commit message.

```typescript
// Current
!/\[TASK-\d{3}\]/.test(message)

// Proposed
!/\[TASK-\d{3}\](,?\s?\[TASK-\d{3}\])*/.test(message)
```

And ensure the logic handles cases like `chore: batch lock [TASK-001] [TASK-002]`.

## Estimated size
XS

## Gaps
- Should we limit the number of tasks per commit?
- Should the format be strictly comma-separated?

## Decision
<!-- Human writes here after THINK evaluation -->
