## TASK-999: Fix escalation deduplication: idempotency key on (subject, type) before append
**Meta:** P2 | S | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/, docs/agents/AGENTS.md
**Turns:** 0
**Closed-at:** 2026-05-23T23:40:31.253Z
**Actor:** unknown
**Locked-commit:** 1180f496
**Created-at:** 2026-05-23T23:36:53.927Z

**Depends:** none

### Context

`.arch/escalations.jsonl` has ~200 records with 5–10 duplicates per subject because THINK appends without checking. Protocol says "always append, never read" which causes monotonic duplicate growth. The file is useless as a source of truth. Solution: read last 100 lines before appending, skip if OPEN record for same (subject, type) already exists within last N hours.


### Relevant Context
_confidence: 0.43_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/application/use-cases/escalation-store.ts _(domain)_
- cli/src/main/ts/domain/models/reconciliation.ts _(core)_
- cli/src/main/ts/domain/models/decision.ts _(core)_
- cli/src/main/ts/domain/models/causal-relation.ts _(core)_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_
- ADR-015: Causal Signal Arbitration Layer _(enforced)_

**Failure Patterns:**
- Stealth Merge Commits*(Sprint 6)*: Implicit merges from `git pull` violated the "No-Merge" policy. `arch check` initially failed to block them effectively due to a bug in `MergeCommitCheck` (it found the last 20 merges instead of checking the last 20 commits). **Resolved:** Fixed `MergeCommitCheck` in `cli/src/main/ts/infrastructure/cli/git-cli.ts` and hardened protocol. _(docs/KAIZEN-LOG.md)_
- Protocol Enforcement Lag*(Sprint v0.6.0-final)*: Rollout of machine-enforced `## Hansei` (TASK-195) occurred before `DO.md` was updated (TASK-197), leading to agents following a stale protocol and being blocked by the CLI. **Proposal:** Mandate "Atomic Protocol Updates" where CLI enforcement and documentation changes are delivered in the same commit or task. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [x] partial — correct direction, missing key files
- [x] off — wrong files dominated

### Acceptance Criteria

- [x] Before appending to `.arch/escalations.jsonl`, read the last 100 lines and check for an OPEN record matching `(subject, type)` within the last 24 hours. If found, skip the append.
  - `prose: verified by running THINK twice — second run does not duplicate escalations`

- [x] Compaction utility: `arch govern --compact-escalations` reads the full file, deduplicates by (subject, type, status=OPEN), writes cleaned version.
  - `prose: verified by running compact on current file — duplicates removed`

- [x] AGENTS.md updated: "Do not read `.arch/escalations.jsonl` first" rule updated to "Read last 100 lines to check for deduplication before appending."
  - `prose: AGENTS.md updated — deduplication rule documented`

- [x] `npm test` passes.
  - `prose: 590+ tests pass`

### Definition of Done
- [x] All ACs checked
- [x] `arch review` passes

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Deduplication guard added to EscalationStore.append() — reads last 100 lines, skips if OPEN record for same (subject, type) exists within 24h. compact() method added. arch govern compact-escalations wired. AGENTS.md updated. Removed 54 duplicates from existing 366-record file.
**Constraint:** The 24h window is hardcoded. Edge case: if the same escalation fires more than once per 24h legitimately (e.g., repeated ANDON_HALT on different sessions), only one record is kept.
**Cost:** Minor: legitimate repeated escalations within 24h are suppressed. Acceptable trade-off vs 54 duplicates.
**Forward Action:** None required.
