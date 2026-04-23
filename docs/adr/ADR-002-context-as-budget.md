# ADR-002: Context as a budget, not a default

**Date:** 2026-04-23
**Status:** ACCEPTED
**Deciders:** ARCH Maintainers

---

## Context
LLMs have finite context windows. Loading the entire codebase or documentation for every small task leads to "context rot": increased latency, higher costs, and degraded reasoning performance as the model sifts through irrelevant noise.


## Decision
Treat context as a scarce resource ("budget") that must be explicitly declared for every task. Agents are strictly prohibited from reading files not explicitly listed in a task's `Context-budget` field.


## Rationale
By forcing the declaration of task-specific dependencies, we ensure agents remain focused on relevant logic. This prevents the "everything is important" fallacy and keeps token usage predictable. Explicit budgets act as a forcing function for clean architecture and modularity.


## Consequences

**Positive:**
- **Measured token reduction:** ~75% reduction in typical tasks compared to "full-context" approaches.
- **Improved accuracy:** Higher precision in edits by eliminating noise from unrelated files.
- **Cost control:** Predictable and lower spend per task execution.

**Negative / trade-offs:**
- **Overhead:** Requires upfront effort to define the budget during task creation or refinement.
- **Stalling:** Agents may hit a hard limit if the budget is too narrow, requiring a context expansion turn.

---
<!-- Once ACCEPTED, this ADR is permanent. -->
<!-- To reverse: create a new ADR that supersedes this one. -->
<!-- Reference in tasks: ADR-NNN — no need to re-read, decision is final -->
