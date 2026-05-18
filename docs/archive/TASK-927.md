## TASK-927: Audit and remediate ARCH protocol/implementation inconsistencies
**Meta:** P1 | M | DONE | Focus:no | 9-audit | claude | cli/src/main/ts/, docs/ | Closed-at: 2026-05-18T15:30:00Z

### Context

External review of `arch review` enforcement surface found 7 inconsistencies spanning protocol docs, drift checks, and implementation. These were surfaced during TASK-926 review. **7 findings are tracked as 6 IDEA drafts**: findings 1 and 6 are two aspects of the same protocol fault (INBOX/git-sync both concern agent-read-of-human-surface) and are intentionally bundled into IDEA-inbox-invariant-contradiction. The audit ledger covers all 7 findings.

### Findings (mapped to IDEAs)

| # | Severity | IDEA | Summary | Status |
|---|----------|------|---------|--------|
| 1 | High | IDEA-inbox-invariant-contradiction | AGENTS.md says INBOX is write-only; code reads it in two places; DO.md tells agents to read it | **PROMOTED → TASK-930 (DONE)** |
| 2 | High | IDEA-archive-status-drift-check | drift-checker.ArchiveMetaIntegrity validates only size, not status; non-DONE tasks in archive pass silently | **PROMOTED → TASK-932 (DONE)** |
| 3 | High | IDEA-lock-model-contradiction | DO.md says write lock to meta; AGENTS.md says in-memory only; persisted Locked-commit field is never read back | **PROMOTED → TASK-931 (DONE)** |
| 4 | Medium | IDEA-approval-checker-field-index | checkApprovalPresent reads parts[5] (CLI field) instead of parts[4] (class); produces false-positive warnings | **PROMOTED → TASK-928 (DONE)** |
| 5 | Medium | IDEA-actor-routing-config-key | mark-task-in-progress reads config.routing?.strategies (undefined); actual key is config.strategies | **PROMOTED → TASK-929 (DONE)** |
| 6 | Medium | IDEA-inbox-invariant-contradiction *(bundled with finding 1)* | git sync policy contradicts itself across AGENTS.md and DO.md | Deferred — git sync decision not yet made; TASK-930 covers INBOX reads only |
| 7 | Medium | IDEA-corpus-drift-repair | TASK-249, TASK-919, TASK-258 violate operational conventions in committed state | **PROMOTED → TASK-933 (DONE)** |

### Acceptance Criteria

- [x] IDEA-approval-checker-field-index evaluated and closed (TASK-928 DONE).
- [x] IDEA-actor-routing-config-key evaluated and closed (TASK-929 DONE).
- [x] IDEA-inbox-invariant-contradiction evaluated (PROMOTE → TASK-930).
- [x] IDEA-archive-status-drift-check evaluated (PROMOTE → TASK-932).
- [x] IDEA-lock-model-contradiction evaluated (PROMOTE → TASK-931).
- [x] IDEA-corpus-drift-repair evaluated (PROMOTE → TASK-933).
- [x] High-severity findings (1, 2, 3) resolved: TASK-930, 931, 932 all closed.
- [x] `arch review` warning count does not increase after remediation commits.
- [x] `arch report` passes after remediation.

### Definition of Done
- [x] IDEA-approval-checker-field-index has a Decision field (PROMOTE → TASK-928).
- [x] IDEA-actor-routing-config-key has a Decision field (PROMOTE → TASK-929).
- [x] IDEA-inbox-invariant-contradiction has a Decision field (PROMOTE → TASK-930).
- [x] IDEA-archive-status-drift-check has a Decision field (PROMOTE → TASK-932).
- [x] IDEA-lock-model-contradiction has a Decision field (PROMOTE → TASK-931).
- [x] IDEA-corpus-drift-repair has a Decision field.
- [x] TASK-930, 931, 932 closed (High findings resolved).
- [x] `arch review` passes (existing warnings only — no new violations from remediation).

## Hansei

**Severity:** H3b
**Category:** [SpecDrift]
**Decision:** All 7 findings resolved. TASK-928/929 fixed medium no-decision-required bugs. TASK-930/931/932 resolved the three High invariant contradictions (INBOX reads, lock model, archive status). TASK-933 repaired corpus drift. Owner: human (decisions provided 2026-05-18).
**Constraint:** Finding 6 (git sync contradiction, bundled in IDEA-inbox-invariant-contradiction) remains undecided — git sync policy spans a larger scope than TASK-930's INBOX-read fix. Deferred to a future session.
**Cost:** Three High invariant violations were live in production code. Accumulated over multiple sessions without detection. Cost absorbed; no rollout impact since ARCH is pre-1.0.
**Forward Action:** TASK-930/931/932/933 closed. IDEA-tiered-obligations ready to promote when tiered Hansei implementation is prioritized. Finding 6 (git sync) needs a separate decision. TASK-927 is closed.
