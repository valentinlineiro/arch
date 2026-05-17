## TASK-919: arch init: full repo scaffolding with stack detection
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/init-command.ts

**Depends:** TASK-918

### Context

`arch init` exists but is incomplete — it scaffolds a minimal structure. For `npx arch init` to be useful in a new repo, it must: detect the project stack (Node/Python/Go/Rust), pre-populate `arch.config.json` routing strategies for that stack, create all required dirs, and write a first seed task prompting the user to define their first epic.

### Acceptance Criteria

- [ ] `arch init` in an empty directory creates: `docs/tasks/`, `docs/archive/`, `docs/adr/`, `docs/agents/`, `docs/refinement/archive/`, `docs/guidelines/`, `docs/tensions/`, `.arch/`, `AGENTS.md` symlink → `docs/AGENTS.md`.
  - `prose: verified by running arch init in temp dir`

- [ ] Stack detection: reads `package.json` (Node), `requirements.txt`/`pyproject.toml` (Python), `go.mod` (Go), `Cargo.toml` (Rust). Detected stack pre-populates `arch.config.json` with sensible routing strategies for that stack (e.g. Node → claude-code/sonnet for M tasks, ollama for XS).
  - `file: cli/src/main/ts/application/commands/init-command.ts`

- [ ] After scaffolding, writes `docs/tasks/TASK-001.md` with title "Define first epic" and class `1-code-reasoning`, status READY, prompting the user to describe their first work stream.
  - `prose: TASK-001.md created with correct structure`

- [ ] Idempotent: running `arch init` a second time in an existing ARCH repo prints "Already initialised. Run arch review to check system state." and exits 0 without overwriting anything.
  - `prose: second run exits 0 without overwriting`

- [ ] `arch review` passes in the scaffolded repo.
  - `prose: verified in temp dir`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
