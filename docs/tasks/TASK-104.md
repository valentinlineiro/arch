## TASK-104: Cost routing - batch API queue for non-urgent XS writing tasks
**Meta:** P2 | S | 7 | READY | Focus:no | 7-operations | local | scripts/arch.sh, arch.config.json, docs/agents/
**Depends:** TASK-103

### Acceptance Criteria
- [ ] `arch exec` detects when the focused task is class `6-writing` and size `XS` and routes it to the Anthropic Batch API instead of the synchronous claude CLI.
- [ ] Batch requests are queued in `docs/.arch-batch-queue.json` (gitignored) and submitted in bulk via `arch drain` or automatically on `arch govern` tick.
- [ ] `arch drain` polls the Batch API for completed results, writes outputs to the terminal, and applies any file changes produced by the batch job.
- [ ] A `governance.batchWritingTasks` boolean in `arch.config.json` controls this behaviour (default: false — opt-in).
- [ ] When batching is disabled, `exec` falls back to synchronous invocation.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
