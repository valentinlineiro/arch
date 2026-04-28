## TASK-074: Deprecate stale DISPATCH.md
**Meta:** P2 | XS | READY | Focus:yes | 7-operations | docs | docs/DISPATCH.md, docs/adr/ADR-003-dispatch-ephemeral.md
**Depends:** none

### Acceptance Criteria
- [ ] Update `docs/DISPATCH.md` to clearly mark it as DEPRECATED
- [ ] Redirect users to terminal output and `docs/INBOX.md` in `DISPATCH.md`
- [ ] Verify no other active docs depend on `DISPATCH.md` as a source of truth
- [ ] Update `ADR-003-dispatch-ephemeral.md` if it references the persisted file as active

### Definition of Done
- [ ] `docs/DISPATCH.md` is deprecated
- [ ] Consistency between ADR-003 and implementation
- [ ] `arch review` passes
