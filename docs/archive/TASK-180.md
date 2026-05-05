## TASK-180: Create docs/PRINCIPLES.md - distill KAIZEN-LOG into durable principles
**Meta:** P2 | S | DONE | Focus:no | 6-writing | claude | docs/KAIZEN-LOG.md, docs/guidelines/, docs/agents/THINK.md
**Closed-at:** 2026-05-05T09:14:29.266Z
**Depends:** none

### Context
KAIZEN-LOG is an event log. Institutional wisdom is buried in chronological noise. THINK Phase 3 currently reads KAIZEN-LOG as its primary Kaizen context, which becomes increasingly expensive and noisy as the log grows.

### Acceptance Criteria
- [x] `docs/PRINCIPLES.md` created with structure: title, Source, Status (ACTIVE/SUPERSEDED), Rule, Rationale
- [x] Seeded with at least 3 principles distilled from current KAIZEN-LOG entries
- [x] THINK.md Phase 3 updated to read PRINCIPLES.md as primary Kaizen context (KAIZEN-LOG kept for auditability)
- [x] Superseded entries are marked SUPERSEDED with reference to replacing principle, not deleted

### Definition of Done
- [x] `arch review` passes

## Hansei
PRINCIPLES.md is authored without a defined process for keeping it in sync as KAIZEN-LOG grows — a future update should specify when a new KAIZEN entry triggers a new principle vs. merely reinforces an existing one.
