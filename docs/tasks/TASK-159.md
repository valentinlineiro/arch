## TASK-159: Define and Implement Metrics Schema for METRICS.md
**Meta:** P2 | S | IN_PROGRESS | Focus:no | 7-operations | local | docs/METRICS.md, cli/src/main/ts/domain/services/metrics-service.ts | lock:gemini-cli
**Depends:** none

### Acceptance Criteria
- [ ] Define JSON schema for metrics storage if needed, or structured Markdown format for `docs/METRICS.md`.
- [ ] Include: cycle time (P50/P90), cost per task, REVIEW_FAIL rate, and token usage trends.
- [ ] Ensure the format is machine-readable for future dashboarding.

### Context
#### Problem
Cycle time, cost per task, REVIEW_FAIL rate y token usage solo están en git log. No hay vista agregada.

#### Solution
Definir esquema y comando `arch metrics` para poblar `docs/METRICS.md`.

### Definition of Done
- [ ] All ACs checked.
- [ ] arch review passes.
