## TASK-237: Consolidate L2 autonomy rule to single canonical source
**Meta:** P3 | XS | READY | Focus:no | 6-writing | claude-code | docs/guidelines/autonomy.md, docs/AGENTS.md, docs/agents/THINK.md
**Depends:** none

### Context
The L2 autonomous promotion rule (XS + 6-writing/7-operations + human Decision required) is repeated verbatim across docs/AGENTS.md, docs/guidelines/autonomy.md, and docs/agents/THINK.md. Violates DRY and creates drift risk during maintenance.

### Acceptance Criteria
- [ ] `docs/guidelines/autonomy.md` is the canonical source for the L2 rule
- [ ] `docs/AGENTS.md` and `docs/agents/THINK.md` reference the rule by link/name instead of repeating it
- [ ] Rule text is identical across all references (or removed from non-canonical locations)
