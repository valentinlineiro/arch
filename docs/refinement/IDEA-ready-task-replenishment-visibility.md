# IDEA: READY-task replenishment visibility — emit [REPLENISHMENT] block when floor breached

**Status:** DRAFT
**Created:** 2026-06-02
**Source:** THINK Phase 1 replenishment check — READY count = 2 < 3, no visible output from the check
**Candidate-class:** 3-process
**Candidate-size:** XS

## Problem

The THINK.md hard rule (§3) requires READY count ≥ 3. When the floor is breached, THINK creates a new IDEA but emits no visible signal to the human. The replenishment action is invisible — the human sees only that a new IDEA appeared in `docs/refinement/` without knowing why or that a governance floor was breached.

## Proposed solution

When READY count < 3 during Phase 1 replenishment check, emit a structured `[REPLENISHMENT]` block at the top of the INBOX.md Alerts section:

```
[REPLENISHMENT] READY count: X/3 — floor breached. Created: IDEA-<slug>.md. Pending decisions on N existing DRAFT IDEAs would close the gap.
```

Format: one-line, machine-parseable, human-readable. Output only when floor is breached (no emission when count ≥ 3).

## Validation hints

- Set READY count to 2 artificially; run THINK; verify `[REPLENISHMENT]` block appears in INBOX.md
- Set READY count back to 3+; re-run; verify block is absent
- `arch review` passes

## Dependencies

None — purely operational, output format change only.

## Sessions: 1

## Decision

(awaiting human decision)
