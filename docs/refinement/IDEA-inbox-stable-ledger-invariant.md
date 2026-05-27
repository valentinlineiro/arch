# IDEA: INBOX hygiene must preserve REVIEW_REQUEST entries for tasks still in REVIEW status
**Created:** 2026-05-27
**Source:** smartcart-os observation — govern regenerated INBOX.md and wiped REVIEW_REQUEST entries for TASK-002, 012, 013, 014, 016, 019 — tasks still in REVIEW status, not yet archived. Those entries were the only audit trail for pending Auditor verification.
**Status:** DRAFT
**Candidate-class:** 2-code-generation
**Candidate-size:** S

## Problem

`arch govern`'s INBOX regeneration pass overwrites manually-written REVIEW_REQUEST entries. The current hygiene logic (post-TASK-1058) removes REVIEW_REQUEST sections only for *archived* tasks. But govern's full INBOX rewrite — separate from the hygiene pass — discards all sections it doesn't explicitly preserve, including REVIEW_REQUEST entries for tasks still in REVIEW status.

The effect: a task reaches REVIEW, gets a REVIEW_REQUEST written to INBOX, and then the next govern tick deletes it. The task file retains its REVIEW status, but the INBOX signal for the human Auditor is gone.

This confirms the architectural observation: **INBOX is a materialized view, not a stable ledger.** The risk is that Auditor work disappears silently. Tasks can sit in REVIEW indefinitely with no INBOX signal because govern keeps wiping the entry.

Related: the correct ledger for "awaiting Auditor" is the task file's REVIEW status. INBOX should surface this — but regeneration must not suppress it.

## Proposed outcome

After any govern tick, all tasks currently in REVIEW status have a corresponding entry visible in INBOX.md. Govern's INBOX pass either:
- (A) Preserves existing REVIEW_REQUEST entries for REVIEW-status tasks, or
- (B) Actively re-emits REVIEW_REQUEST entries for all REVIEW-status tasks as part of the regeneration pass

Either outcome: an Auditor reading INBOX after a govern tick always sees every pending review.

Option B is more robust — it means INBOX is always complete regardless of prior state, rather than depending on whether a previous entry survived the hygiene filter.

## Proposed solution

In `govern-system.ts`, after the hygiene pass, scan `docs/tasks/*.md` for all tasks with REVIEW status. For each, ensure a `## [AWAITING_REVIEW] TASK-XXX` section exists in INBOX. If missing, append it. This is idempotent (deduplicated by task ID). The section format matches the existing `AWAITING_REVIEW_RE` so future hygiene correctly removes it on archival.

This replaces the fragile "preserve manually-written entries" approach with a deterministic "govern always reconstructs the complete review queue."

## Validation hints

- `cli/src/main/ts/application/use-cases/govern-system.ts` — verify REVIEW-status tasks always produce an INBOX entry after tick
- Test: set two tasks to REVIEW status, wipe their INBOX entries, run govern tick — both must reappear in INBOX
- `npm test` passes

## Dependencies

None — though TASK-1058 (inbox hygiene REVIEW_REQUEST cleanup) is complementary: this IDEA ensures entries are always present; TASK-1058 ensures stale entries (for archived tasks) are removed.

## Gaps

## Decision
