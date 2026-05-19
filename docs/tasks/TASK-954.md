## TASK-954: Temporal Pattern Layer for Causal Discovery
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | local | cli/src/main/ts/

**Depends:** none

### Context

The causal graph is a DAG suited for structural rationale, not for detecting temporal recurrences (e.g., "this Hansei category has appeared 3 times in the last 10 tasks"). Recurrence detection is a time-series problem over labeled events.

**Prerequisite:** `recurs_in` must be added to `RelationType` in `cli/src/main/ts/domain/models/causal-relation.ts` before this task can emit valid causal signals.

**Definitions (binding):**
- **Threshold:** `WEAK_SIGNAL_THRESHOLD = 3` (from `signal-router.ts`) — a category appearing ≥3 times constitutes a spike.
- **Label store schema:** JSONL file at `.arch/temporal-index.jsonl`, one record per task completion: `{ taskId, timestamp, labels: string[] }` where labels are Hansei category values.
- **Spike:** a label appearing in ≥3 records within the last 20 entries of the temporal index.

### Acceptance Criteria

- [ ] `recurs_in` added to `RelationType` union and `VALID_RELATIONS` array.  →  grep: "recurs_in" cli/src/main/ts/domain/models/causal-relation.ts
- [ ] `TemporalIndex` use-case writes `{ taskId, timestamp, labels }` records to `.arch/temporal-index.jsonl` on task completion.  →  file: .arch/temporal-index.jsonl
- [ ] `arch ask` includes a "Recurrence detected" section when a label appears ≥3 times in the last 20 entries.  →  prose: verified by reading ask-command output with seeded temporal index containing 3 entries of the same category
- [ ] `arch reflect` surfaces category spikes as `[REFLECT-SUGGESTS]` kaizen items using the same threshold.  →  prose: verified by reading reflect-command output with seeded temporal index
- [ ] When a spike is detected, a `causal-signal` is emitted with `relation: recurs_in` linking the triggering task to the prior instances.  →  prose: verified by inspecting causal-signal.jsonl after a spike-triggering task completion
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** Task promoted with EXTEND decision overridden by human. Three gaps (underspecified ACs, wrong size, missing recurs_in) were documented and resolved inline in this task file rather than in a prerequisite task. The binding definitions and prerequisite AC are embedded in Context and ACs.
**Constraint:** Human chose to consolidate prerequisite work into a single M task rather than split into XS prerequisite + M implementation task.
**Cost:** If the recurs_in prerequisite AC is missed during implementation the causal signal emission will fail schema validation at runtime — forward-caught by the AC predicate.
**Forward Action:** No IDEA required — gaps are fully resolved in this task's ACs.

### Definition of Done

- [ ] All ACs checked.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0
