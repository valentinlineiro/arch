## TASK-125: Add easy task rejection command for human reviewers
**Meta:** P1 | XS | 7 | IN_PROGRESS | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/task-reject.ts

## Problem
When a human reviews a task in REVIEW status, there's no streamlined way to reject the solution. The only option is to manually edit the task and move it back, which is friction that discourages rejection feedback.

## Solution
Add `arch task reject <task-id> --reason "<feedback>"` that:
1. Moves task from REVIEW → READY (or BACKLOG if major rework)
2. Adds rejection comment with timestamp and feedback
3. Removes from REVIEW queue

## Acceptance Criteria
- [ ] Add reject subcommand in cli/src/main/ts/application/use-cases/task-reject.ts
- [ ] Handle: move status, add rejection comment, clear any lock
- [ ] Add to arch.sh router
- [ ] Test: reject a task, verify status change and comment