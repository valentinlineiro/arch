## TASK-258: Resolve arch review warning - Large git diff
**Meta:** P2 | XS | DONE | Focus:no | 7-operations | local | .git/
**Turns:** 0
**Closed-at:** 2026-05-19T11:40:07.047Z
**Actor:** unknown
**Locked-commit:** 20282e9a
**Created-at:** 2026-05-19T11:39:47.568Z

### Context
`arch review` reports a warning: "Warning: Large git diff detected. Ensure commits remain atomic."
This usually happens when too many changes are accumulated without being committed, or if a single commit is too large.


### Relevant Context
_confidence: 0.46_

**Files:**
- cli/src/main/ts/domain/models/reflect-decision.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/services/deterministic-hansei-checker.ts _(core)_
- cli/src/main/ts/domain/services/signal-router.ts _(core)_
- cli/src/main/ts/application/use-cases/focus-ledger.ts _(domain)_

**ADRs:**
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_
- ADR-003: DISPATCH output is ephemeral — exception to ADR-001 _(enforced)_
- ADR-007: Census Context Budget Check in DriftChecker _(enforced)_

**Guidelines:**
- testing-a-change.md
- core.md

**Failure Patterns:**
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_
- Protocol Enforcement Lag*(Sprint v0.6.0-final)*: Rollout of machine-enforced `## Hansei` (TASK-195) occurred before `DO.md` was updated (TASK-197), leading to agents following a stale protocol and being blocked by the CLI. **Proposal:** Mandate "Atomic Protocol Updates" where CLI enforcement and documentation changes are delivered in the same commit or task. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Acceptance Criteria

- [x] Identify the cause of the large diff (staged vs unstaged vs commit size).  →  prose: root cause documented in Hansei
- [x] Reduce diff size through atomic commits or targeted exclusion.  →  prose: diff no longer large
- [x] `arch review` no longer emits the large-diff warning.  →  cmd: arch review; grep: no large diff warning
- [x] Hansei recorded at close.

## Hansei

**Severity:** H3b
**Category:** RecurringProcess
**Decision:** Root cause is governance metadata accumulation between `arch govern` ticks. Files `.arch/*.jsonl`, `docs/EVENTS.md`, `docs/METRICS.md`, `docs/INBOX.md` are written by govern but not committed atomically — they drift until the next explicit commit. The 5000-byte threshold in `review-system.ts` fires on unstaged accumulation, not on any single large commit. Fixed by committing accumulated metadata. Owner: recurring process — govern output should be committed in the same tick.
**Constraint:** The `review-system.ts` threshold (5000 bytes) cannot be raised without masking legitimate large-commit violations. The real fix is ensuring govern commits its own outputs atomically — govern already does this for archive moves, but causal/chronicle/events writes are not always batched with the govern commit.
**Cost:** Zero implementation cost this session — commit of existing files only. Recurring cost: this warning will resurface whenever a long session runs many govern ticks without flushing metadata.
**Forward Action:** IDEA-automate-govern-metadata-flush — govern should commit its own metadata writes atomically. Expiry: TASK-262 (Hansei Wizard) session — if govern metadata flush is not addressed by then, escalate to its own task.
