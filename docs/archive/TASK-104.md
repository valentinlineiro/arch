## TASK-104: Cost routing - batch API queue for non-urgent XS writing tasks
**Meta:** P2 | S | 7 | DONE | Focus:yes | 7-operations | local | scripts/arch.sh, arch.config.json, docs/agents/
**Depends:** TASK-103
**Closed-at:** 2026-04-28T13:17:59.407Z

### Acceptance Criteria
- [x] `arch exec` detects when the focused task is class `6-writing` and size `XS` and routes it to the Anthropic Batch API instead of the synchronous claude CLI.
- [x] Batch requests are queued in `docs/.arch-batch-queue.json` (gitignored) and submitted in bulk via `arch drain` or automatically on `arch govern` tick.
- [x] `arch drain` polls the Batch API for completed results, writes outputs to the terminal, and applies any file changes produced by the batch job.
- [x] A `governance.batchWritingTasks` boolean in `arch.config.json` controls this behaviour (default: false — opt-in).
- [x] When batching is disabled, `exec` falls back to synchronous invocation.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
