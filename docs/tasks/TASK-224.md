## TASK-224: Chronicle causal graph v1 — flat append-only relation store
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/, .arch/
**Depends:** none

### Context
Chronicle is a write-only event log. It records TASK_STARTED and TASK_COMPLETED. That is not causal inference — it is a timestamp with a name.

The moat requires knowing *why* tasks exist, *what* decisions caused recurring failures, *which* ADRs reduced a failure class. Co-occurrence in `arch ask` is a proxy for causality, not causality itself.

Chronicle v1 closes that gap with the minimum viable structure: a flat, append-only, git-native JSONL file of directed causal relations between entities (tasks, ADRs, guidelines, patterns).

No graph DB. No ontology engine. Flat assertions. Human-writable. Machine-queryable.

### Acceptance Criteria
- [ ] `arch causal add TASK-220 implements ADR-011` records a relation → `.arch/causal-graph.jsonl` → cmd: arch causal add TASK-220 implements ADR-011; exit: 0
- [ ] `arch causal add TASK-184 caused_by TASK-220` records inverse relation → cmd: arch causal add TASK-184 caused_by TASK-220; exit: 0
- [ ] `arch causal add` with unknown relation type exits 1 → cmd: arch causal add TASK-001 invented ADR-001; exit: 1
- [ ] `arch causal show TASK-220` displays outgoing and incoming relations → prose: verified by running show after two adds
- [ ] `npm test --prefix cli` passes → cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes → cmd: arch review; exit: 0

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.

### Hansei
<!-- to be filled on close -->
