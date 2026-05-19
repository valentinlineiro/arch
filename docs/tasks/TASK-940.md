## TASK-940: Implement semantic collision detection - AC-vs-ADR conflict advisory at capture/start
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/commands/capture-command.ts, cli/src/main/ts/application/commands/task-command.ts, docs/adr/
**Closed-at:** 2026-05-19T13:29:06Z
**Actor:** unknown
**Locked-commit:** 17e3a68d
**Created-at:** 2026-05-19T12:49:53.756Z

### Context

ADRs encode settled decisions. When a new task's Acceptance Criteria contradict an existing ADR, the contradiction is undetected until `arch review` — after implementation. Semantic Collision Detection catches this at the boundary: when an AC is written (capture) or when a task is started, before implementation begins.

The critical design constraint: if this becomes a string-matching ADR cop with high false-positive rate, operators will ignore it. The confidence bar (≥3 shared domain terms + detectable negation in the ADR text) is the mechanism that keeps signal-to-noise high. The system is silent when uncertain.


### Relevant Context
_confidence: 0.44_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/causal-signal.ts _(core)_
- cli/src/main/ts/domain/models/causal-relation.ts _(core)_
- cli/src/main/ts/domain/services/signal-router.ts _(core)_

**ADRs:**
- ADR-023: Deterministic Gate Invariant _(enforced)_
- ADR-015: Causal Signal Arbitration Layer _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Non-Goals

- Not a blocker. `arch task capture` and `arch task start` always proceed; the advisory is informational only.
- Not semantic reasoning. Matching is structural: token overlap + negation pattern detection. No embeddings, no LLM call in the hot path.
- Not a replacement for `arch review`. This catches declared AC conflicts; implementation-level drift is still caught at review.
- DRAFT and DEPRECATED ADRs excluded. Only ACCEPTED ADRs are checked.

### Gaps

- **ADR status field**: ADR files use `**Status:**` in the header. Confirm the parser can extract status reliably before filtering. Some older ADRs may use different header formats.
- **Negation pattern vocabulary**: the detection algorithm requires a list of negation markers (`must not`, `never`, `prohibited`, `all X must`, `only via`). This list needs to be seeded from actual ADR constraint language in this repo, not assumed from general English.
- **Dismissal annotation format**: `<!-- adr-conflict-dismissed: ADR-NNN -->` must survive the task file round-trip through `parseTask()` without being stripped. Confirm the parser preserves HTML comments in task content.

### Acceptance Criteria

- [x] `arch task capture` and `arch task start` run a conflict check against all ACCEPTED ADRs when the task has ≥1 AC defined.  →  prose: SemanticCollisionDetector wired into both capture-command.ts and task-command.ts start path; extracts AC block and scans ACCEPTED ADRs
- [x] Advisory is only emitted when ≥3 shared domain terms AND a negation pattern are detected in the ADR constraint text. Tasks with incidental term overlap produce no output.  →  prose: extractTerms() filters stop words and short words; findNegationSnippet() checks 13 negation patterns; both conditions required
- [x] Advisory output goes to stdout only. No writes to INBOX, escalations.jsonl, or the task file.  →  grep: no append calls in the collision detection code path
- [x] A task file containing `<!-- adr-conflict-dismissed: ADR-NNN -->` suppresses the advisory for that ADR on subsequent starts.  →  prose: extractDismissedAdrs() parses HTML comment annotations and skips those ADR IDs
- [x] `arch review` passes.  →  cmd: arch review; exit: 0
- [x] CLI tests pass.  →  cmd: npm test --prefix cli; exit: 0

### Definition of Done

- [x] An agent starting a task whose AC contradicts an ACCEPTED ADR sees the conflict advisory before writing a line of code.
- [x] Tasks with no ADR conflicts produce no output from this check (zero noise overhead on clean tasks).
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

## Approval
Approved-by: Auditor | 2026-05-19

## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** The negation vocabulary (13 patterns seeded from actual ADR constraint language) and the stop-word list (40 common words plus ARCH-specific noise terms) were derived empirically from the repo's ADRs rather than assumed. The ≥3-term threshold is intentionally conservative — it will miss narrow conflicts but avoids false-positive noise that trains operators to dismiss the advisory. The advisory-only design is the load-bearing invariant: this is a signal layer, not a gate.
**Constraint:** Token overlap remains a proxy for semantic conflict. Two ACs can share 5+ terms with an ADR while being architecturally compatible (e.g., implementing the same system in a compliant way). The system cannot distinguish compliance from contradiction without semantic reasoning. Operators must read the advisory and judge. This limitation is explicit and accepted by design.
**Cost:** Each capture and task-start now reads all ACCEPTED ADR files (~24 files, ~50KB total). Negligible at current scale. At 100+ ADRs a pre-computed term index would be warranted. Deferred.
**Forward Action:** After 30 days of operation, check dismissed-annotation count vs total advisory emissions. If dismissal rate exceeds 30%, raise the term threshold from 3 to 4 or narrow the negation vocabulary. See IDEA-corpus-informed-reprioritization for related advisory-layer design patterns.
