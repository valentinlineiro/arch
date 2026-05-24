## TASK-995: Web dashboard (arch ui)
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | local | cli/src/main/ts, docs/refinement/archive/IDEA-productizing-arch-separation.md
**Source:** IDEA-productizing-arch-separation Phase D
**Depends:** none

### Acceptance Criteria
- [ ] `arch ui` starts a local dev server serving the web dashboard → cmd: arch ui --help; exit: 0
- [ ] Dashboard visualizes `docs/tasks/` current sprint status (READY, IN_PROGRESS, REVIEW counts) → grep: "sprint" cli/src/main/ts/commands/ui.ts
- [ ] Dashboard renders the Causal Memory as an interactive node graph from `.arch/causal-signal.jsonl` → file: cli/src/main/ts/ui/graph.tsx
- [ ] High-level impact digest from `arch analyze` is rendered as a summary panel → grep: "analyze" cli/src/main/ts/ui/dashboard.tsx
- [ ] Dashboard is read-only (no create/edit/delete operations) → grep: "readOnly" cli/src/main/ts/ui/server.ts
- [ ] `arch check` passes → cmd: arch check; exit: 0

### Definition of Done
- [ ] `arch ui` serves a functional read-only dashboard
- [ ] arch check passes → cmd: node cli/dist/index.js check; exit: 0
- [ ] `arch check` passes

## Hansei
<!-- Placeholder — to be filled at close per ADR-019 -->
