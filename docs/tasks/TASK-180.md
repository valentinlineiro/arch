## TASK-180: Create docs/PRINCIPLES.md - distill KAIZEN-LOG into durable principles
**Meta:** P2 | S | READY | Focus:no | 6-writing | claude | docs/KAIZEN-LOG.md, docs/guidelines/, docs/agents/THINK.md
**Depends:** none

### Context
KAIZEN-LOG is an event log. Institutional wisdom is buried in chronological noise. THINK Phase 3 currently reads KAIZEN-LOG as its primary Kaizen context, which becomes increasingly expensive and noisy as the log grows.

### Acceptance Criteria
- [ ] `docs/PRINCIPLES.md` created with structure: title, Source, Status (ACTIVE/SUPERSEDED), Rule, Rationale
- [ ] Seeded with at least 3 principles distilled from current KAIZEN-LOG entries
- [ ] THINK.md Phase 3 updated to read PRINCIPLES.md as primary Kaizen context (KAIZEN-LOG kept for auditability)
- [ ] Superseded entries are marked SUPERSEDED with reference to replacing principle, not deleted

### Definition of Done
- [ ] `arch review` passes
