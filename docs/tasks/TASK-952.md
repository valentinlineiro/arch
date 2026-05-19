## TASK-952: Remove XL decomposition rule duplication
**Meta:** P3 | XS | READY | Focus:no | 6-writing | local | docs/guidelines/core.md, AGENTS.md

**Depends:** none

### Context

The rule that XL tasks must be decomposed before READY is stated in two places:

1. `docs/guidelines/core.md` §4 — "Decomposition: Tasks estimated XL must be decomposed before entering READY status." (canonical)
2. `AGENTS.md` "Hard limits" — "No `XL` tasks in READY — decompose first." (duplicate)

Remove the duplicate from `AGENTS.md`. The canonical statement stays in `core.md`.

### Acceptance Criteria

- [ ] Canonical rule is present in core.md.  →  grep: "decomposed before entering READY" docs/guidelines/core.md
- [ ] Duplicate removed from AGENTS.md.  →  prose: AGENTS.md Hard limits section no longer contains a standalone XL decomposition rule
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] All ACs checked.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0
