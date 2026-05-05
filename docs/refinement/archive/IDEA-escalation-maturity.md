# IDEA: Escalation maturity - advance ARCH from Level 2.5 to Level 5
**Created:** 2026-05-05
**Source:** Codex escalation maturity review — ARCH currently at Level 2.5-3 of 7
**Status:** DRAFT
**Sessions:** 1
**Meta:** P1 | L | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, docs/agents/DO.md, docs/HALT.md

## Problem
ARCH has good escalation design (declared conditions, approval gates, protected paths) but weak escalation enforcement. Escalation triggers are not reliably machine-detected — the executor must judge whether to escalate, and weak or rushed models misclassify situations rather than halt. The maturity assessment:

- **Level 1 (Declared):** Yes — halt conditions written, protected paths defined.
- **Level 2 (Structured):** Mostly — fixed templates exist but INBOX entries aren't fully machine-parseable.
- **Level 3 (Detectable):** Partial — biggest gap. CLI doesn't auto-detect protected-path edits, repeated review failures, budget overruns, or missing ADR prerequisites.
- **Level 4 (Fail-Closed):** Not fully — ambiguous task shape causes improvisation, not escalation.
- **Level 5 (Verifiable):** Incomplete — `arch review` doesn't check whether required escalation happened.
- **Level 6 (Low-Judgment):** Not yet — executor still decides "is this risky?"
- **Level 7 (Auditable):** Early-stage — escalations cannot be counted or analyzed by type.

Required for weak-model autonomy: Level 6. Required for unattended autonomy: Level 7.

## Proposed solution
Phase the work toward Level 5 (verifiable), which is the practical ceiling for the current architecture:

**Phase 1 — Level 3: Detectable (highest leverage)**
- Protected-path edit detection: `arch review` flags commits touching paths in `arch.config.json:protectedPaths` without a corresponding ADR entry.
- Repeated review failure detection: `arch review` flags tasks that have been in REVIEW more than once (REVIEW → READY → REVIEW cycle).
- Budget overrun detection: `arch next` (TASK-193) emits HALT when task cost exceeds configured threshold.

**Phase 2 — Level 4: Fail-Closed**
- Ambiguous task shape (missing ACs, no size, no context paths) causes `arch task start` to exit non-zero rather than proceed.
- Stale INBOX (last regeneration > N hours) blocks `arch next` with a HALT reason.

**Phase 3 — Level 5: Verifiable**
- `arch review` checks that each HALT-LOG entry (from TASK-194) has a corresponding human resolution or explicit deferral.
- Missed-escalation scenarios covered by integration tests.

## Dependencies
- TASK-193 (`arch next`) — budget overrun halt and stale-INBOX block
- TASK-194 (HALT.md + HALT-LOG.md) — halt log infrastructure for Phase 3
- IDEA-approval-entry-check — structured approval payload for Level 2 completion

## Estimated size
L — three phases, multiple drift checks and CLI guards, tests for escalation scenarios

## Gaps
All resolved:
- **Git integration in `arch review`:** `arch review` gains git diff parsing capability (not delegated to post-commit hook). This is an explicit scope-in decision.
- **Ambiguous task shape:** defined as failure to meet the existing DoR in `TASK-FORMAT.md` — all Meta line fields (Priority, Size, Status, Focus, Class, CLI, Context) + at least one AC + Gaps section for M+ tasks. No new rules needed; `arch task start` enforces the existing DoR.
- **Promotion:** split into 3 tasks at promotion time, one per phase.

## Decision
PROMOTE → TASK-202 (Phase 1), TASK-203 (Phase 2), TASK-204 (Phase 3)
