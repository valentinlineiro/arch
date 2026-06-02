# IDEA: Refinement archival gate — auto-archive PROMOTED IDEAs when task is DONE

**Status:** PROMOTED
**Created:** 2026-06-02
**Source:** THINK replenishment — 6 PROMOTED IDEA files sitting in active docs/refinement/ with completed tasks; INBOX regeneration counts them as active
**Candidate-class:** 7-operations
**Candidate-size:** S

## Problem

When an IDEA is promoted (`PROMOTE → TASK-XXX`), the system does not archive the IDEA file from `docs/refinement/`. The IDEA stays in the active directory indefinitely. Currently 6 such PROMOTED files remain in `docs/refinement/` after their tasks completed and were archived.

This has two effects:
1. INBOX regeneration counts PROMOTED files as active IDEA entries, producing inflated refinement queue counts and stale `AWAITING_PROMOTION` entries
2. THINK sessions re-scan PROMOTED files during Phase 2 triage, wasting context budget on already-decided entries

## Proposed solution

A lightweight gate (not a CLI change — a structural cleanup pass) that:
1. Scans `docs/refinement/` for files with `**Status:** PROMOTED
2. For each, parses the Decision field for `PROMOTE → TASK-XXX`
3. Checks if `docs/archive/TASK-XXX.md` exists (task is DONE)
4. If yes: moves the IDEA file to `docs/refinement/archive/`
5. Emits `[CLEANUP] IDEA-slug → archived (task TASK-XXX DONE)` to stdout

Can run as part of the INBOX regeneration step (Phase 1 step 4) since INBOX is the main consumer of stale counts.

## Validation hints

- Run the gate against current state: 6 files should archive, only IDEA-auto-task-turns should remain
- After gate: `ls docs/refinement/*.md | grep -c PROMOTED` returns 0
- INBOX refinement queue count matches actual file count
- `arch review` passes

## Dependencies

None — purely operational.

## Sessions: 1

## Decision

(awaiting human decision)
