## TASK-133: Track task cost and steps for KAIZEN friction detection
**Meta:** P2 | XS | READY | Focus:yes | 7-operations | claude | cli
**Depends:** none

### Acceptance Criteria
- [ ] Extend task metadata to capture `Cost` (USD) and `Steps` (turns).
- [ ] Implement cost tracking logic in the CLI/scripts that aggregates LLM API usage.
- [ ] Automatically append `Cost: $X.XX` and `Steps: N` to the task's Meta line upon completion.
- [ ] Ensure aggregation works correctly across sub-agent invocations.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
