## TASK-260: Consolidate root agent docs — remove stale AGENTS.md
**Meta:** P2 | XS | READY | Focus:no | 6-writing | claude | AGENTS.md, GEMINI.md, docs/AGENTS.md

### Context

The root `AGENTS.md` is a stale v0.1 file with non-English content, while `GEMINI.md` is a symlink to the authoritative `docs/AGENTS.md`. This creates a cognitive trap for new agents who may read the wrong file and follow outdated protocol. The root `AGENTS.md` must be removed and all references updated.

### Acceptance Criteria

- [ ] Root `AGENTS.md` is deleted and `GEMINI.md` (symlink to `docs/AGENTS.md`) is the sole authoritative entry point.
- [ ] No remaining references to the stale root `AGENTS.md` exist in operational docs or CLI code.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [ ] Root `AGENTS.md` removed; `GEMINI.md` symlink confirmed intact pointing to `docs/AGENTS.md`.
- [ ] `arch review` passes.
