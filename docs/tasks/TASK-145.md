## TASK-145: Add Poka-Yoke rule to bugs.md - recurring KAIZEN errors must produce arch review checks
**Meta:** P1 | XS | READY | Focus:yes | 6-writing | local | docs/guidelines/bugs.md, docs/KAIZEN-LOG.md
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [ ] Add a "Poka-Yoke" section to `docs/guidelines/bugs.md` with the rule: any error pattern appearing 2+ times in `KAIZEN-LOG.md` must have a corresponding `arch review` check before the pattern is considered resolved.
- [ ] Define the two valid exit conditions for a Kaizen entry: (a) `arch review` check prevents the error, or (b) pattern accepted as known trade-off with documented rationale.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
