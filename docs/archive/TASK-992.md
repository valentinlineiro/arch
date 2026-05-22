## TASK-992: Extract hardcoded ARCH paths to arch.config.json
**Meta:** P1 | S | DONE | Focus:yes | 2-code-generation | local | cli/src/main/ts, arch.config.json
**Source:** IDEA-productizing-arch-separation Phase A
**Closed-at:** 2026-05-22T14:00:00Z

### Acceptance Criteria
- [x] All hardcoded `docs/tasks`, `docs/archive`, `docs/guidelines`, `docs/agents`, `docs/refinement`, `docs/adr` paths are extracted from CLI source to `arch.config.json` paths block → cmd: grep -r "docs/tasks" cli/src/main/ts/domain/ | grep -v node_modules | grep -v ".spec." | wc -l; exit: 0
- [x] CLI reads all paths from `arch.config.json` at startup → grep: "config.paths.tasks" cli/src/main/ts/domain/config/config-loader.ts
- [x] `arch check` passes with no violations → cmd: arch check; exit: 0
- [x] Existing tests pass → cmd: npm test --prefix cli; exit: 0
- [x] No hardcoded path strings remain in domain logic (utils/formatters may retain display-only paths with `// arch-allow-hardcoded-path` comment)

### Definition of Done
- [x] `arch.config.json` paths block is the single source of truth for all ARCH directory references
- [x] `arch check` passes
