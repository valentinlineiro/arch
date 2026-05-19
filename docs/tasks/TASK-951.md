## TASK-951: Add idea: commit exception to core.md
**Meta:** P3 | XS | READY | Focus:no | 6-writing | local | docs/guidelines/core.md
**Depends:** none

### Context

`docs/guidelines/core.md` states every commit must reference a TASK-ID, but does not document the `idea:` exception. The exception exists in `AGENTS.md` ("Exception: `idea:` commits for IDEA drafts do not require a TASK-ID") but is absent from `core.md`, creating ambiguity for agents that load only the guidelines.

### Acceptance Criteria

- [ ] `docs/guidelines/core.md` commit section documents the `idea:` exception explicitly.  →  grep: "idea:" docs/guidelines/core.md
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] All ACs checked.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0
