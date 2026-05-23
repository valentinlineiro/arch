## TASK-999: Fix escalation deduplication: idempotency key on (subject, type) before append
**Meta:** P2 | S | READY | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/, docs/agents/AGENTS.md

**Depends:** none

### Context

`.arch/escalations.jsonl` has ~200 records with 5–10 duplicates per subject because THINK appends without checking. Protocol says "always append, never read" which causes monotonic duplicate growth. The file is useless as a source of truth. Solution: read last 100 lines before appending, skip if OPEN record for same (subject, type) already exists within last N hours.

### Acceptance Criteria

- [ ] Before appending to `.arch/escalations.jsonl`, read the last 100 lines and check for an OPEN record matching `(subject, type)` within the last 24 hours. If found, skip the append.
  - `prose: verified by running THINK twice — second run does not duplicate escalations`

- [ ] Compaction utility: `arch govern --compact-escalations` reads the full file, deduplicates by (subject, type, status=OPEN), writes cleaned version.
  - `prose: verified by running compact on current file — duplicates removed`

- [ ] AGENTS.md updated: "Do not read `.arch/escalations.jsonl` first" rule updated to "Read last 100 lines to check for deduplication before appending."
  - `file: docs/agents/AGENTS.md`

- [ ] `npm test` passes.
  - `prose: 590+ tests pass`
