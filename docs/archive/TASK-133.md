## TASK-133: Track task cost and steps for KAIZEN friction detection
**Meta:** P2 | XS | DONE | Focus:yes | 7-operations | claude | cli | Cost: $0.05 | Steps: 10
**Closed-at:** 2026-04-30T10:42:08.230Z
<!-- arch-metrics: cost=0.05, steps=10 -->
**Depends:** none

### Acceptance Criteria
- [x] Extend task metadata to capture `Cost` (USD) and `Steps` (turns).
- [x] Implement cost tracking logic in the CLI/scripts that aggregates LLM API usage.
- [x] Automatically append `Cost: $X.XX` and `Steps: N` to the task's Meta line upon completion.
- [x] Ensure aggregation works correctly across sub-agent invocations.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
