## TASK-159: Define and Implement Metrics Schema for METRICS.md
**Meta:** P2 | S | DONE | Focus:no | 7-operations | local | docs/METRICS.md
**Closed-at:** 2026-05-05T09:14:29.030Z
**Depends:** none

### Acceptance Criteria
- [x] Define JSON schema for metrics storage if needed, or structured Markdown format for `docs/METRICS.md`.
- [x] Include: cycle time (P50/P90), cost per task, REVIEW_FAIL rate, and token usage trends.
- [x] Ensure the format is machine-readable for future dashboarding.

### Context
#### Problem
Cycle time, cost per task, REVIEW_FAIL rate y token usage solo están en git log. No hay vista agregada.

#### Solution
Definir esquema y comando `arch metrics` para poblar `docs/METRICS.md`.

### Definition of Done
- [x] All ACs checked.
- [x] arch review passes.
