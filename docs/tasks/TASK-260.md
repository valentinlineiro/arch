## TASK-260: Consolidate root agent docs - remove stale AGENTS.md
**Meta:** P2 | XS | IN_PROGRESS | Focus:no | 6-writing | claude | AGENTS.md, GEMINI.md, docs/AGENTS.md
**Actor:** unknown
**Locked-commit:** 566a37b0
**Created-at:** 2026-05-19T11:40:22.738Z

### Context

The root `AGENTS.md` is a stale v0.1 file with non-English content, while `GEMINI.md` is a symlink to the authoritative `docs/AGENTS.md`. This creates a cognitive trap for new agents who may read the wrong file and follow outdated protocol. The root `AGENTS.md` must be removed and all references updated.


### Relevant Context
_confidence: 0.46_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_
- cli/src/main/ts/domain/services/reviewer.ts _(core)_
- cli/src/main/ts/application/use-cases/context-inference.ts _(domain)_

**ADRs:**
- ADR-021: Refinement funnel TTL and admission gate _(enforced)_
- ADR-003: DISPATCH output is ephemeral — exception to ADR-001 _(enforced)_
- ADR-001: Use git as the primary state engine _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Missing Mura Signals*(Sprint v0.6.0-final)*: Although TASK-182 introduced the `Turns: N` metadata field, agents are not consistently recording this field at task completion. This creates a data gap for THINK Phase 4 (Mura detection). **Proposal:** Automate turn-count recording in the `arch task done` command or within the EXEC loop logic to remove reliance on agent judgment. _(docs/KAIZEN-LOG.md)_
- Phantom Archive Sync Latency*(Sprint v0.6.0-final)*: Tasks marked `DONE` by an Auditor (human or agent) remain in `docs/tasks/` until the next `arch govern` tick. This creates a "stale backlog" window where `arch status` and INBOX show tasks that are technically complete. **Proposal:** Integrate phantom-archive sync directly into `arch task done`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Acceptance Criteria

- [ ] Root `AGENTS.md` is deleted and `GEMINI.md` (symlink to `docs/AGENTS.md`) is the sole authoritative entry point.
- [ ] No remaining references to the stale root `AGENTS.md` exist in operational docs or CLI code.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Root `AGENTS.md` removed; `GEMINI.md` symlink confirmed intact pointing to `docs/AGENTS.md`.
- [ ] `arch review` passes.
