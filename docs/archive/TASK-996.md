## TASK-996: Register arch analyze in index.ts: command built but not wired
**Meta:** P2 | XS | DONE | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/index.ts
**Turns:** 0
**Closed-at:** 2026-05-23T20:44:17.535Z
**Actor:** unknown
**Locked-commit:** 262b9d14
**Created-at:** 2026-05-23T20:43:39.719Z

**Depends:** none

### Context

`analyze-command.ts` implements `arch analyze` including promotion proposals (TASK-966), but the command was never registered in `index.ts`. Running `arch analyze` shows the help screen instead of the command output. The implementation is complete — only the dispatch case is missing.


### Relevant Context
_confidence: 0.47_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/decision.ts _(core)_
- cli/src/main/ts/domain/models/action.ts _(core)_
- cli/src/main/ts/domain/models/reflect-decision.ts _(core)_
- cli/src/main/ts/application/commands/analyze-command.ts _(domain)_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_

**Guidelines:**
- bugs.md
- core.md

**Failure Patterns:**
- Stealth Merge Commits*(Sprint 6)*: Implicit merges from `git pull` violated the "No-Merge" policy. `arch check` initially failed to block them effectively due to a bug in `MergeCommitCheck` (it found the last 20 merges instead of checking the last 20 commits). **Resolved:** Fixed `MergeCommitCheck` in `cli/src/main/ts/infrastructure/cli/git-cli.ts` and hardened protocol. _(docs/KAIZEN-LOG.md)_
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Acceptance Criteria

- [x] `case 'analyze':` added to `index.ts` dispatch switch, importing and executing `AnalyzeCommand`
  - `cmd: node cli/dist/index.js analyze; exit: 0`

- [x] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] AC checked by Auditor
- [x] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** arch analyze was already wired via command-dispatcher.ts — task was pre-implemented. ACs verified.
**Constraint:** Task was pre-implemented — analyze was wired in command-dispatcher before filing.
**Cost:** No architectural debt introduced. Verification only.
**Forward Action:** None.
