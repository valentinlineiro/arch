## TASK-897: Author ARCH-Core minimal execution contract for weak models
**Meta:** P2 | M | IN_PROGRESS | Focus:yes | 6-writing | claude-code | docs/

**Depends:** none

### Context

The full ARCH governance stack (THINK.md, DO.md, PRINCIPLES.md, KAIZEN-LOG.md) requires significant synthesis to follow correctly. Weak models and local LLMs lose state across long instructions and invent missing structure. This task authors a minimal execution contract — `docs/ARCH-CORE.md` — that gives any model a 5-step CLI-only execution path without loading governance prose.

**Mode selection decision (resolved):** Human chooses which doc to load. `AGENTS.md` onboarding section documents two entry points: Core (weak models, local LLMs, boilerplate tasks) and Governance (strong models, kaizen, protocol evolution). No automatic detection — the human sets context by choosing which file to pass to the session.

### Acceptance Criteria

- [ ] `docs/ARCH-CORE.md` authored with exactly 5 steps, CLI commands only, no governance prose:
  1. `arch review` — verify system integrity (read-only, always safe)
  2. `arch task next` — get the task with Focus:yes
  3. Read the task file; execute each AC in order
  4. `arch task review TASK-XXX` — all predicates must pass
  5. On any failure: halt, append `ANDON_HALT` reason to `docs/INBOX.md`, stop
  - `file: docs/ARCH-CORE.md`

- [ ] `docs/ARCH-CORE.md` explicitly states: Ops (sprint management, task creation, IDEA promotion) are NOT permitted in Core mode.
  - `file: docs/ARCH-CORE.md`

- [ ] `docs/AGENTS.md` onboarding section updated to document two entry points: load `docs/ARCH-CORE.md` for execution-only sessions; load full `docs/agents/DO.md` + `docs/agents/THINK.md` for governance sessions.
  - `file: docs/AGENTS.md`

- [ ] `arch.config.json` gets an optional `coreMode: true` flag in the provider entries for Ollama/local models — a comment-only hint for humans routing weak models, not enforced by CLI.
  - `file: arch.config.json`

- [ ] `arch review` passes clean after implementation.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
