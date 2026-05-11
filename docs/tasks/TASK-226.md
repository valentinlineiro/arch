## TASK-226: Wire feedback capture into LoopEngine task completion
**Meta:** P2 | XS | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/
**Depends:** none

## Context

LoopEngine constructed MarkTaskDone without a FeedbackRepository, so tasks completed via `arch loop` silently skipped feedback extraction. This gap means the learning loop (capture → scaffold → context → done → feedback → better inference) is broken for the automated loop path. The fix is a two-line change: import NodeFeedbackRepository and pass it as the 5th argument.

## Acceptance Criteria

- [x] `LoopEngine` passes `NodeFeedbackRepository` to `MarkTaskDone`
- [x] `npm test` passes (381/381)

## Hansei

Minimal fix. The broader learning loop infrastructure (FeedbackSignal, ExtractContextFeedback, ContextInference feedback adjustment) was already implemented — this was the only gap preventing the automated path from participating.
