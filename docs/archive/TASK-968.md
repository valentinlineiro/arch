## TASK-968: Run architectural review of CLI with three outputs: (1) boun
**Meta:** P1 | S | DONE | Focus:no | 6-writing | local | docs/tasks/
**Closed-at:** 2026-05-20T15:45:00Z
**Locked-commit:** c9df753c
**Actor:** unknown
**Created-at:** 2026-05-19T14:47:35.886Z
**Depends:** none

### Acceptance Criteria
- [x] Document exists at declared path  →  file: docs/reviews/cli-arch-review-2026-05-20.md
- [x] All three sections present: boundary violation map, readability audit, recommendation set  →  prose: verified
- [x] `arch review` passes  →  cmd: node cli/dist/index.js review; exit: 0

### Context


### Relevant Context
_confidence: 0.46_

**Files:**
- .arch/focus-ledger.jsonl _(utility)_
- docs/INBOX.md _(utility)_
- docs/METRICS.md _(utility)_
- .arch/reflect-breach-log.jsonl _(utility)_
- cli/src/main/ts/application/use-cases/drift-checker.ts _(domain)_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_
- ADR-016: Define the semantic boundary of the domain layer _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Batch lock commit fails TASK-ID validator*(Sprint 3)*: Locking 4 tasks in a `[SPRINT]` commit caused `arch review` to report a format violation. The validator assumes a single TASK-ID per commit — batch planning commits are an uncovered edge case. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Run architectural review of CLI with three outputs: (1) boundary violation map across application/domain/infrastructure layers and command wiring, (2) readability audit distinguishing necessary comments from comment volume caused by unclear structure, (3) recommendation set split into direct refactors / issues to become tasks / acceptable debt. Produce written report.

### Definition of Done
- [x] All ACs checked by Auditor  →  prose: verified
- [x] `arch review` passes  →  cmd: node cli/dist/index.js review; exit: 0

## Hansei
**Severity:** H0
**Category:** [ReviewBlindspot]
**Decision:** This was a writing task requiring a survey of the full CLI source tree. Used an Explore subagent to gather raw facts (imports, line counts, comment densities) then synthesized findings into three structured sections. The agent's upward-dependency finding (4 domain/services importing from application/use-cases/) was confirmed via direct grep. The govern-system → CorpusAuditCommand coupling (use-case importing a command) was independently verified. All violation claims are grounded in actual file/line references.
**Constraint:** The readability section relies on comment-line counts as proxy — actual comment quality requires reading each file. The density figures (0.9% for task-command, 1.9% for drift-checker) are structurally significant but the qualitative judgment "symptomatic vs. necessary" is based on file context, not exhaustive reading.
**Cost:** None — report is accurate and grounded; no production code was modified.
**Forward Action:** T1/T2 (bridge-provider, sandbox, deterministic verifiers → infrastructure) are the highest-value follow-up tasks to capture.