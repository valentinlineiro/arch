## TASK-267: Fix malformed meta lines in docs/archive/ and add pre-archive guard
**Meta:** P2 | S | READY | Focus:no | 7-operations | claude | docs/archive/

### Context

`arch report` failed with CRITICAL INTEGRITY BREACH due to malformed meta lines in `docs/archive/` (e.g., empty size fields like `P1 | | DONE`). This task identifies and backfills all malformed archived meta lines and adds a pre-archive validation guard to `arch review` so no task can be archived with a malformed meta line.

### Acceptance Criteria

- [ ] All malformed meta lines in `docs/archive/` are identified and corrected with appropriate field values derived from context.
- [ ] `arch review` includes a pre-archive guard that fails if a task being archived has a malformed meta line.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] All archive meta lines valid; pre-archive guard implemented.
- [ ] `arch review` passes.
