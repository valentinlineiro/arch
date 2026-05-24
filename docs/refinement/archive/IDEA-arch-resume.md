# IDEA: arch-resume — automate ANDON_HALT recovery paths
**Created:** 2026-05-24
**Source:** ROADMAP-IDEAS — arch-resume entry, graduated by THINK 2026-05-24
**Status:** PROMOTED
**Meta:** P2 | S | human | cli/src/main/ts/application/commands/resume-command.ts, .arch/escalations.jsonl

## Problem

`arch resume` does not exist. When `ANDON_HALT` fires, recovery is a manual process: read INBOX.md, identify the halt reason, take the correct sequence of actions, re-run `arch govern`. This costs 5–15 minutes per halt and requires knowing the recovery action for each halt type. Under time pressure, humans skip the correct procedure and force past the halt with `--force`, which corrupts the integrity audit trail.

## Proposed Solution

`arch resume <taskId>` reads `.arch/escalations.jsonl` for the most recent OPEN ANDON record for that task, determines the halt reason, and executes the deterministic recovery path:

| HALT reason | Recovery action |
|---|---|
| `REVIEW_FAIL` (3x) | Resets task to READY, clears REVIEW lock, appends REVIEW_RESET to ledger |
| `INTEGRITY_BREACH` | Runs append-only repair, commits fix, re-validates |
| `FOCUS_VIOLATION` | Runs `arch govern` tick — auto-resolves |
| `BUDGET_EXHAUSTED` | Prompts for new size, updates Meta line, reopens task |
| `ANDON_HALT` (corpus) | Surfaces `arch corpus audit` output, prompts action |
| Unknown | Prints halt context and exits non-zero — no silent swallowing |

After successful recovery: closes the escalation record (sets `status: RESOLVED`, `resolved_by: arch-resume`, `resolved_at: <timestamp>`), appends `FOCUS_RECOVERED` ruling to `.arch/focus-ledger.jsonl`, runs `arch check` to confirm clean state.

## Constraint Axes
- **Dependency ordering:** None — escalations.jsonl and focus-ledger exist and are stable
- **Temporal validity:** Valid now — ANDON_HALT has been firing for weeks, patterns are known
- **Abstraction layer:** Correct — CLI command, not a protocol change
- **Observability validity:** Deterministic — escalations.jsonl is machine-readable
- **Priority displacement:** P2 — not blocking current work but compounds every halt

## Gaps
- `arch task restart` (REVIEW_FAIL path) does not exist — needs S sub-task
- `arch govern --repair` (INTEGRITY_BREACH path) does not exist — needs XS sub-task
- `arch task extend` (BUDGET_EXHAUSTED path) does not exist — needs XS sub-task

These can be stubbed initially with clear error messages and implemented incrementally.

## Decision
PROMOTE → TASK-1001
