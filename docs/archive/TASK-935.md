## TASK-935: Add missing Approval sections to TASK-255, TASK-257, TASK-927
**Meta:** P2 | XS | DONE | Focus:no | 9-audit | claude | docs/archive/TASK-255.md, docs/archive/TASK-257.md, docs/archive/TASK-927.md | Closed-at: 2026-05-18T18:30:00Z

### Acceptance Criteria
- [x] `docs/archive/TASK-255.md` has `## Approval` section  →  grep: "## Approval" docs/archive/TASK-255.md
- [x] `docs/archive/TASK-257.md` has `## Approval` section  →  grep: "## Approval" docs/archive/TASK-257.md
- [x] `docs/archive/TASK-927.md` has `## Approval` section  →  grep: "## Approval" docs/archive/TASK-927.md
- [x] `arch review` ApprovalPresent warning count is zero  →  cmd: bash scripts/arch.sh review; exit: 0
