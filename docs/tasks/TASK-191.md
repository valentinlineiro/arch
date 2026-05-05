## TASK-191: Implement conflict resolver for trivial autonomous merge
**Meta:** P1 | M | REVIEW | Focus:no | 2-code-generation | claude-code | docs/agents/DO.md, cli/src/main/ts/ | Turns: 32
**Depends:** none

### Context
At L2/L3, concurrent loop sessions collide on append-only files (INBOX.md, task status lines). Currently the human resolves every merge conflict manually — they become a git-merge bot. The conflict resolver auto-merges trivially safe conflicts and escalates the rest, unblocking autonomous operation without risking data loss.

### Acceptance Criteria
- [x] `DO.md` documents the conflict resolution protocol: auto-merge is permitted only for pure-append conflicts on `docs/INBOX.md` and `**Meta:**` status-line-only changes in `docs/tasks/*.md`; all other conflicts escalate to INBOX
- [x] `arch merge-resolve` command (or integrated into `arch loop`) detects merge conflicts after `git pull --rebase`, auto-resolves qualifying conflicts using chronological append order, and logs a `MERGE_AUTO` entry to INBOX
- [x] A `MERGE_ESCALATE` entry is written to INBOX for any conflict that does not meet the auto-merge criteria, halting the loop until human resolution
- [x] Auto-merge never touches `docs/adr/`, `arch.config.json`, or `cli/src/main/ts/domain/` (protected paths always escalate)
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Hansei
The initial Meta line format was stricter than expected, causing a lint failure when I followed DO.md's instruction to add a lock. I chose to proceed without the lock to maintain canonical format, but this highlights a discrepancy between DO.md and the CLI validator that should be addressed in a future task.
