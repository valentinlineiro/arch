## TASK-940: Implement semantic collision detection — AC-vs-ADR conflict advisory at capture/start
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/commands/capture-command.ts, cli/src/main/ts/application/commands/task-command.ts, docs/adr/

### Context

ADRs encode settled decisions. When a new task's Acceptance Criteria contradict an existing ADR, the contradiction is undetected until `arch review` — after implementation. Semantic Collision Detection catches this at the boundary: when an AC is written (capture) or when a task is started, before implementation begins.

The critical design constraint: if this becomes a string-matching ADR cop with high false-positive rate, operators will ignore it. The confidence bar (≥3 shared domain terms + detectable negation in the ADR text) is the mechanism that keeps signal-to-noise high. The system is silent when uncertain.

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

- [ ] `arch task capture` and `arch task start` run a conflict check against all ACCEPTED ADRs when the task has ≥1 AC defined.  →  prose: verified by capturing a task with an AC that contradicts a known ADR and confirming advisory output
- [ ] Advisory is only emitted when ≥3 shared domain terms AND a negation pattern are detected in the ADR constraint text. Tasks with incidental term overlap produce no output.  →  prose: verified by capturing a task with 1-2 shared terms and confirming silence
- [ ] Advisory output goes to stdout only. No writes to INBOX, escalations.jsonl, or the task file.  →  grep: no append calls in the collision detection code path
- [ ] A task file containing `<!-- adr-conflict-dismissed: ADR-NNN -->` suppresses the advisory for that ADR on subsequent starts.  →  prose: verified by adding the dismissal annotation and re-running arch task start
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0
- [ ] CLI tests pass.  →  cmd: npm test --prefix cli; exit: 0

### Definition of Done

- [ ] An agent starting a task whose AC contradicts an ACCEPTED ADR sees the conflict advisory before writing a line of code.
- [ ] Tasks with no ADR conflicts produce no output from this check (zero noise overhead on clean tasks).
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Advisory-only constraint is the load-bearing design choice. A blocking implementation would require LLM-quality semantic reasoning to avoid unacceptable false-positive rates; a structural token-overlap approach is only trustworthy as an advisory. The confidence bar (≥3 terms + negation) was set conservatively: it will miss some real conflicts, but it will not generate false alerts that train operators to ignore the system.

**Constraint:**
Token overlap is a proxy for semantic conflict. Two ACs can use identical terms while being architecturally compatible, and two ACs can conflict without sharing surface-level vocabulary. The minimum-viable implementation catches the obvious cases; subtle conflicts still require THINK or human review.

**Cost:**
Each capture and task-start now incurs ADR scan overhead. With < 30 ADRs this is negligible. At 100+ ADRs, a pre-computed ADR term index (built during govern ticks) may be needed. Deferred until the corpus reaches that scale.

**Forward Action:**
After 30 days of operation, audit false-positive rate: count dismissed annotations vs total advisories emitted. If dismissal rate > 30%, tighten the negation vocabulary or raise the term threshold.
