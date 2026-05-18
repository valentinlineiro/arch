## TASK-268: Align phase naming between ADR-013 and THINK.md
**Meta:** P2 | XS | READY | Focus:no | 6-writing | claude | docs/adr/ADR-013-two-tier-drift-detection.md, docs/agents/THINK.md

### Context

ADR-013 references "THINK Phase 3.5" for semantic drift analysis, but `docs/agents/THINK.md` implements this as "Phase 2.5". This discrepancy creates confusion about the protocol's structure and makes ADR-013 appear outdated. The terminology must be aligned so both documents reference the same phase name.

### Acceptance Criteria

- [ ] ADR-013 and THINK.md reference the same phase name for the semantic drift analysis phase (either "Phase 2.5" or "Phase 3.5" — one document is updated to match the other).
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Phase naming consistent across ADR-013 and THINK.md.
- [ ] `arch review` passes.
