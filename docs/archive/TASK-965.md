## TASK-965: Extend L3 self-archive eligibility to M tasks in 6-writing and 7-operations
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | local | cli/src/main/ts/
**Closed-at:** 2026-05-20T16:55:00Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Task ACs were placeholder stubs at READY — same pattern as TASK-964. ACs rewritten before implementation. One additional discovery: `parseACLines` only recognized `cmd|file|test|prose|code` — had to add `file-contains|not-file` to the recognizer regex or predicates were silently dropped.
**Constraint:** The predicate recognizer in `parseACLines` used a hard-coded alternation that didn't account for new types. Discovered only when tests showed `type: 'unknown'` for `file-contains:` ACs.
**Cost:** One extra debugging step to find the silent drop in `parseACLines`. No architectural debt introduced.
**Forward Action:** None required — the recognizer pattern is now extensible by appending to the alternation.

## Approval
Auditor: Valentín Liñeiro
Reviewed: 2026-05-20
All 7 ACs verified against actual repo state. 15/15 ac-verifier tests pass, 26/26 mark-task-done tests pass. `arch review` exits 0.
