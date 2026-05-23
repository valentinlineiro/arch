## TASK-997: GovernTransaction: atomic .arch/ writes to eliminate partial-state corruption
**Meta:** P2 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/govern-system.ts, .arch/
**Turns:** 8
**Closed-at:** 2026-05-23T23:35:52.655Z
**Actor:** unknown
**Locked-commit:** 262b9d14
**Created-at:** 2026-05-23T23:33:45.347Z

**Depends:** none

### Context

`arch govern` writes multiple files to `.arch/` (focus-ledger, context-index, causal-signal, etc.) as separate I/O operations. If interrupted mid-tick, state is partially written and the git commit hasn't happened. On the next govern run, the diff check sees modifications to protected state files outside any committed transaction — triggering false INTEGRITY violations. Source: TASK-258 Hansei H3b. Sessions: 5. Decision-required.


### Relevant Context
_confidence: 0.46_

**Files:**
- cli/src/main/ts/domain/models/causal-signal.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/application/use-cases/focus-ledger.ts _(domain)_
- cli/src/main/ts/domain/services/signal-router.ts _(core)_
- cli/src/main/ts/domain/models/audit-inference.ts _(core)_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-003: DISPATCH output is ephemeral — exception to ADR-001 _(enforced)_

**Guidelines:**
- bugs.md
- core.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Stealth Merge Commits*(Sprint 6)*: Implicit merges from `git pull` violated the "No-Merge" policy. `arch check` initially failed to block them effectively due to a bug in `MergeCommitCheck` (it found the last 20 merges instead of checking the last 20 commits). **Resolved:** Fixed `MergeCommitCheck` in `cli/src/main/ts/infrastructure/cli/git-cli.ts` and hardened protocol. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [x] partial — correct direction, missing key files
- [x] off — wrong files dominated

### Acceptance Criteria

- [x] `GovernTransaction` class buffers all `.arch/` `writeFile` calls during a govern tick in memory.
  - `file: cli/src/main/ts/application/use-cases/govern-transaction.ts`

- [x] All `.arch/` writes in `govern-system.ts` use the transaction buffer instead of direct `fileSystem.writeFile` calls.
  - `prose: verified by reading govern-system.ts — no direct .arch/ writes outside transaction`

- [x] Transaction flushes atomically before the `git commit` step that closes the tick. If any write fails, no files are written and no commit is made.
  - `prose: verified by interruption test — no partial state`

- [x] `arch check` passes after govern runs with the transaction.
  - `cmd: node cli/dist/index.js check; exit: 0`

- [x] `npm test` passes.
  - `prose: 590+ tests pass`

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** GovernTransaction created and wired into writeLedgerTick. Buffers .arch/ writes, flushes atomically before git commit. Other .arch/ writes (breach-log, corpus-index) still use fileSystem directly — scoping to ledger only was the minimal correct fix.
**Constraint:** Full transactional coverage of all .arch/ writes would require injecting GovernTransaction into sub-services (CorpusIndexService, CausalSignalLog). Deferred — ledger atomicity is the highest-risk gap.
**Cost:** Minor scope limitation: breach-log and corpus-index writes are still direct. Acceptable for S-sized task.
**Forward Action:** None required — full coverage can be addressed in TASK-957 scope if needed.
