## TASK-936: Fix READY status on six archived tasks (TASK-215, 231, 234-237)
**Meta:** P2 | XS | IN_PROGRESS | Focus:yes | 9-audit | claude | docs/archive/TASK-215.md, docs/archive/TASK-231.md, docs/archive/TASK-234.md, docs/archive/TASK-235.md, docs/archive/TASK-236.md, docs/archive/TASK-237.md

### Acceptance Criteria
- [ ] All six Meta lines show `DONE` status and include `Closed-at: 2026-05-16T00:00:00Z`  →  prose: verified by grep
- [ ] `arch review` ArchiveMetaIntegrity warning count is zero  →  cmd: bash scripts/arch.sh review; exit: 0
