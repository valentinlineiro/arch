## TASK-919: arch init: full repo scaffolding with stack detection
**Meta:** P2 | M | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/init-command.ts
**Actor:** unknown
**Locked-commit:** c88385b
**Created-at:** 2026-05-19T09:46:13.896Z

**Depends:** TASK-918

### Context

`arch init` exists but is incomplete — it scaffolds a minimal structure. For `npx arch init` to be useful in a new repo, it must: detect the project stack (Node/Python/Go/Rust), pre-populate `arch.config.json` routing strategies for that stack, create all required dirs, and write a first seed task prompting the user to define their first epic.


### Relevant Context
_confidence: 0.43_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_
- cli/src/main/ts/application/commands/init-command.ts _(domain)_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files (n/a)
- [ ] off — wrong files dominated (n/a)

### Acceptance Criteria

- [ ] `arch init` creates required dirs and `AGENTS.md` as a symlink to `docs/AGENTS.md`.  →  prose: verified by running arch init in /tmp/arch-init-test — symlinks confirmed with ls -la
- [ ] Stack detection reads package.json/requirements.txt/go.mod/Cargo.toml and pre-populates arch.config.json routing strategies.  →  file: cli/src/main/ts/application/commands/init-command.ts
- [ ] After scaffolding, `docs/tasks/TASK-001.md` exists with title "Define first epic", class 1-code-reasoning, status READY.  →  prose: verified in temp dir — head -3 docs/tasks/TASK-001.md confirms title and meta
- [ ] Second run prints "Already initialised. Run arch review to check system state." and exits 0 without overwriting anything.  →  prose: verified in temp dir — second node init run exited 0 with idempotency message
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Gaps

Need to explore the current `init-command.ts` implementation to understand what's already scaffolded before adding stack detection and seed task creation.

### Definition of Done
- [ ] All ACs checked.  →  prose: verified by arch task review
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0
- [ ] `npm test` passes in `cli/`.  →  cmd: npm test --prefix cli; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Not yet started. Implementation will follow stack detection findings.
**Constraint:** No specific constraints identified at this early stage of research.
**Cost:** No debt introduced as no implementation code has been written yet.
**Forward Action:** None.
