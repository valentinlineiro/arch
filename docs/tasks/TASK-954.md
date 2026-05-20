## TASK-954: Temporal Pattern Layer for Causal Discovery
**Meta:** P2 | M | DONE | Focus:yes | 2-code-generation | local | cli/src/main/ts/
**Closed-at:** 2026-05-20T16:16:00Z
**Actor:** unknown
**Locked-commit:** e29ca26f
**Created-at:** 2026-05-20T15:19:28.358Z

**Depends:** none

### Context

The causal graph is a DAG suited for structural rationale, not for detecting temporal recurrences (e.g., "this Hansei category has appeared 3 times in the last 10 tasks"). Recurrence detection is a time-series problem over labeled events.

**Prerequisite:** `recurs_in` must be added to `RelationType` in `cli/src/main/ts/domain/models/causal-relation.ts` before this task can emit valid causal signals.

**Definitions (binding):**
- **Threshold:** `WEAK_SIGNAL_THRESHOLD = 3` (from `signal-router.ts`) — a category appearing ≥3 times constitutes a spike.
- **Label store schema:** JSONL file at `.arch/temporal-index.jsonl`, one record per task completion: `{ taskId, timestamp, labels: string[] }` where labels are Hansei category values.
- **Spike:** a label appearing in ≥3 records within the last 20 entries of the temporal index.


### Relevant Context
_confidence: 0.46_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/causal-signal.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/causal-relation.ts _(core)_
- cli/src/main/ts/domain/models/decision.ts _(core)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-023: Deterministic Gate Invariant _(enforced)_
- ADR-014: Causal Graph Schema for Chronicle _(enforced)_

**Guidelines:**
- models.md
- bugs.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Missing Mura Signals*(Sprint v0.6.0-final)*: Although TASK-182 introduced the `Turns: N` metadata field, agents are not consistently recording this field at task completion. This creates a data gap for THINK Phase 4 (Mura detection). **Proposal:** Automate turn-count recording in the `arch task done` command or within the EXEC loop logic to remove reliance on agent judgment. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Gaps

None — prerequisite (`recurs_in` in RelationType) and binding definitions (threshold=3, window=20, schema) are embedded in Context above. All integration points are covered by ACs.

### Acceptance Criteria

- [x] `recurs_in` added to `RelationType` union and `VALID_RELATIONS` array.  →  grep: "recurs_in" cli/src/main/ts/domain/models/causal-relation.ts
- [x] `TemporalIndex` use-case writes `{ taskId, timestamp, labels }` records to `.arch/temporal-index.jsonl` on task completion.  →  file: cli/src/test/ts/temporal-index.test.ts (test: append writes JSONL record)
- [x] `arch ask` includes a "Recurrence detected" section when a label appears ≥3 times in the last 20 entries.  →  file: cli/src/main/ts/application/commands/ask-command.ts (recurringSignals display block)
- [x] `arch reflect` surfaces category spikes as `[REFLECT-SUGGESTS]` kaizen items using the same threshold.  →  file: cli/src/main/ts/application/commands/reflect-command.ts (temporal pattern block in runAnalysis)
- [x] When a spike is detected, a `causal-signal` is emitted with `relation: recurs_in` linking the triggering task to the prior instances.  →  cmd: node --import tsx --test src/test/ts/temporal-index.test.ts; exit: 0 (test: emits recurs_in causal signal)
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** Task promoted with EXTEND decision overridden by human. Three gaps (underspecified ACs, wrong size, missing recurs_in) were documented and resolved inline in this task file rather than in a prerequisite task. The binding definitions and prerequisite AC are embedded in Context and ACs.
**Constraint:** Human chose to consolidate prerequisite work into a single M task rather than split into XS prerequisite + M implementation task.
**Cost:** If the recurs_in prerequisite AC is missed during implementation the causal signal emission will fail schema validation at runtime — forward-caught by the AC predicate.
**Forward Action:** No IDEA required — gaps are fully resolved in this task's ACs.

### Definition of Done

- [x] All ACs checked.
- [x] `arch review` passes.  →  cmd: arch review; exit: 0
