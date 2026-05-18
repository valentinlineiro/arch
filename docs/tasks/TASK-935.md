## TASK-935: Add missing Approval sections to TASK-255, TASK-257, TASK-927
**Meta:** P2 | XS | IN_PROGRESS | Focus:yes | 9-audit | claude | docs/archive/TASK-255.md, docs/archive/TASK-257.md, docs/archive/TASK-927.md

### Acceptance Criteria
- [ ] `docs/archive/TASK-255.md` has `## Approval` section  →  grep: "## Approval" docs/archive/TASK-255.md
- [ ] `docs/archive/TASK-257.md` has `## Approval` section  →  grep: "## Approval" docs/archive/TASK-257.md
- [ ] `docs/archive/TASK-927.md` has `## Approval` section  →  grep: "## Approval" docs/archive/TASK-927.md
- [ ] `arch review` ApprovalPresent warning count is zero  →  cmd: bash scripts/arch.sh review; exit: 0
