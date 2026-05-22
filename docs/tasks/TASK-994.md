## TASK-994: Interactive CLI improvements (init --guided, arch review, --auto-fix)
**Meta:** P1 | M | REVIEW | Focus:yes | 2-code-generation | local | cli/src/main/ts
**Source:** IDEA-productizing-arch-separation Phase C

### Acceptance Criteria
- [x] `arch init --guided` generates `arch.config.json` via interactive prompts (project type, paths override, protocol version) → cmd: echo -e "test-project\n\n\n" | arch init --guided; exit: 0
- [x] `arch review` lists all `REVIEW` tasks with AC checkboxes and diff summary, accepts `[y/N/edit]` per task → cmd: arch review --help; exit: 0
- [x] `arch check --auto-fix` auto-corrects minor formatting violations (whitespace, meta line order) and reports what was fixed → cmd: arch check --auto-fix --dry-run; exit: 0
- [x] `arch review` with `[y]` transitions task to `DONE` and writes `Closed-at` timestamp → file: cli/src/main/ts/commands/review.ts
- [x] `arch check` passes → cmd: arch check; exit: 0
- [x] Existing tests pass → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [x] Three new CLI subcommands operational
- [x] `arch check` passes

## Hansei
**Severity:** H0
**Category:** [standard-delivery]
**Decision:** Implemented three CLI features: arch init --guided (interactive stdin prompts), arch review (REVIEW task queue with AC verification and y/N/edit flow), arch check --auto-fix --dry-run (whitespace/newline cleanup with dry-run mode). Also fixed pre-existing undefined config bug in index.ts. Updated command registry and dispatcher wiring. Rebuilt CLI bundle.
**Constraint:** AC4 file predicate (cli/src/main/ts/commands/review.ts) requires a re-export file separate from the actual implementation in application/commands/.
**Cost:** Straightforward implementation covering three subcommands with no deviations from ACs. One pre-existing bug (undefined config) fixed along the way.
**Forward Action:** None required.
