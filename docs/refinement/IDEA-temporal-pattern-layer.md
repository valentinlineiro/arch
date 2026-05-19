# IDEA: Temporal Pattern Layer for Causal Discovery
**Meta:**P2 | S | DRAFT | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/
**Sessions:** 3 | **Decision-required:** yes
**Source:** Architectural Review (Cold Start Paradox)

### Context

The current Causal Graph is a DAG (Directed Acyclic Graph) connecting entities like tasks and ADRs. While excellent for structural rationale, it is ill-suited for detecting temporal recurrences (e.g., "this failure has happened three times in the last 20 tasks").

Recurrence detection is a time-series problem over labeled events, not a graph traversal problem.

### Objective

Introduce a **Temporal Index** that complements the DAG. This index tracks "Category Pulses" — the frequency and cadence of specific Hansei categories or ontological TENSIONS appearing in the log.

### Proposed Changes

- **Label Store**: Add a lightweight store that indexes every `(taskId, timestamp, [labels])` where labels are Hansei categories or TENSION IDs.
- **Recurrence Heuristic**: `arch ask` and `arch reflect` query the temporal index for spikes. If "ContextWaste" appears 3 times in 10 tasks, it triggers a `PATTERN` signal.
- **Graph Integration**: When a recurrence is detected, the system emits a `causal-signal` with `relation: recurs_in` linking the new task to the previous instances or the underlying TENSION.

### Acceptance Criteria

- [ ] New `TemporalIndex` use-case to store and query labeled event history.
- [ ] `arch ask` includes "Recurrence detected" section if temporal clusters are found.
- [ ] `arch reflect` surfaces category spikes as `[REFLECT-SUGGESTS]` kaizen items.

## Decision

EXTEND

**Gaps preventing decision:**

1. **ACs underspecified.** "Recurrence detected if temporal clusters found" is not implementable without: a defined threshold (WEAK_SIGNAL_THRESHOLD = 3 already exists in the codebase and could serve as the canonical value), a schema for the label store, and a definition of what "spike" means (3 occurrences in N tasks? within a time window?). Without these, the implementing agent fills in the blanks and the result drifts from intent.

2. **Size is wrong.** TemporalIndex + `arch ask` integration + `arch reflect` integration is M, not S. S would be the label store alone. The current scope is mislabeled.

3. **`recurs_in` relation needs a schema entry first.** `RelationType` does not have `recurs_in`. Adding it is an XS prerequisite that should be its own task (or an explicit prerequisite AC in this IDEA) before the temporal layer can emit valid causal signals.

**What would trigger adjudication:** ACs refined with explicit threshold definition (or binding to WEAK_SIGNAL_THRESHOLD), size corrected to M, and `recurs_in` added to RelationType — or alternatively, the IDEA scoped down to just the label store as an S task with a follow-on IDEA for query integration.
