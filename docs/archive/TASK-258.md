## TASK-258: Resolve arch review warning - Large git diff
**Meta:** P2 | XS | DONE | Focus:no | 7-operations | local | .git/
**Closed-at:** 2026-05-19T11:40:07.047Z

## Hansei

**Severity:** H3b
**Category:** RecurringProcess
**Decision:** Root cause is governance metadata accumulation between `arch govern` ticks. Files `.arch/*.jsonl`, `docs/EVENTS.md`, `docs/METRICS.md`, `docs/INBOX.md` are written by govern but not committed atomically — they drift until the next explicit commit. The 5000-byte threshold in `review-system.ts` fires on unstaged accumulation, not on any single large commit. Fixed by committing accumulated metadata. Owner: recurring process — govern output should be committed in the same tick.
**Constraint:** The `review-system.ts` threshold (5000 bytes) cannot be raised without masking legitimate large-commit violations. The real fix is ensuring govern commits its own outputs atomically — govern already does this for archive moves, but causal/chronicle/events writes are not always batched with the govern commit.
**Cost:** Zero implementation cost this session — commit of existing files only. Recurring cost: this warning will resurface whenever a long session runs many govern ticks without flushing metadata.
**Forward Action:** IDEA-automate-govern-metadata-flush — govern should commit its own metadata writes atomically. Expiry: TASK-262 (Hansei Wizard) session — if govern metadata flush is not addressed by then, escalate to its own task.
