# IDEA: Expand testing-a-change.md beyond docs/agents/ changes
**Created:** 2026-04-30
**Source:** Protocol audit — testing-a-change.md is 4 lines covering only agents/ changes; no guidance for CLI, config, or guideline changes
**Status:** DRAFT
**Meta:** P2 | S | local | docs/guidelines/testing-a-change.md

## Problem
`testing-a-change.md` covers exactly one scenario: changes to `docs/agents/`. It says "apply to at least one real project, run one full cycle, note result in PR body." There is no testing guidance for:
- CLI changes (`cli/src/`) — no mention of running the test suite or build
- Config changes (`arch.config.json`) — no validation step
- Guideline changes (`docs/guidelines/`) — no verification that agents can still follow them

This leaves contributors without guidance for the majority of change types.

## Proposed solution
Expand `testing-a-change.md` into a per-change-type matrix:
- **CLI changes:** run `npm run build && npm test`; run `arch review` on the repo after build
- **Agent protocol changes (`docs/agents/`):** existing rule (apply to real project, full cycle)
- **Guideline changes:** run `arch review`; manually verify no active task or protocol references a deleted/renamed construct
- **Config changes:** run `arch review`; confirm the changed field is exercised by at least one CLI path

## Dependencies
None.

## Estimated size
S

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
