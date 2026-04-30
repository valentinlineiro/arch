## TASK-147: Protocol-as-Code - rewrite THINK Phase 1 to delegate to arch govern
**Meta:** P1 | M | READY | Focus:no | 6-writing | local | docs/agents/THINK.md, cli/src/main/ts/application/use-cases/govern-system.ts
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [ ] Rewrite THINK Phase 1 so it calls `arch govern` instead of re-describing what govern does in prose. The step should read: "Run `arch govern`. If govern reports a condition requiring AI judgment, proceed to Phase 2."
- [ ] Verify `arch govern` output is sufficiently verbose to serve as Phase 1 evidence in the terminal report. Add a `--verbose` flag to govern output if needed.
- [ ] Remove or collapse the duplicated prose descriptions of Archival Guard, Flow Guard, and Replenishment from THINK.md (they are authoritative in the CLI code).
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
