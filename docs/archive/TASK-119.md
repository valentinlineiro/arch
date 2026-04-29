## TASK-119: Simplify agent context requirements
**Meta:** P3 | S | 6 | REJECTED | Focus:no | 7-operations | local | docs/agents/, docs/guidelines/
**Reason:** stale
**Rejected-at:** 2026-04-29T10:20:15.374Z

## Description
Reduce token usage and context overhead by simplifying the documentation and instructions agents must ingest to operate.

## Acceptance Criteria
- [ ] Create condensed role guides for DO and THINK modes.
- [ ] Implement a "lazy-loading" pattern for documentation where agents are instructed to read specific files only when needed.
- [ ] Update `AGENTS.md` to point to these condensed guides.
- [ ] `arch review` passes.

## Context
- `docs/refinement/archive/idea-simplify-agent-context.md`
