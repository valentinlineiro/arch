## TASK-074: Deprecate stale DISPATCH.md
**Meta:** P2 | XS | 5 | DONE | Focus:yes | 7-operations | docs | docs/DISPATCH.md, docs/adr/ADR-003-dispatch-ephemeral.md
**Depends:** none

### Acceptance Criteria
- [x] Update `docs/DISPATCH.md` to clearly mark it as DEPRECATED
- [x] Redirect users to terminal output and `docs/INBOX.md` in `DISPATCH.md`
- [x] Verify no other active docs depend on `DISPATCH.md` as a source of truth
- [x] Update `ADR-003-dispatch-ephemeral.md` if it references the persisted file as active

### Definition of Done
- [x] `docs/DISPATCH.md` is deprecated
- [x] Consistency between ADR-003 and implementation
- [ ] `arch review` passes
