## TASK-994: Interactive CLI improvements (init --guided, arch review, --auto-fix)
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | local | cli/src/main/ts
**Source:** IDEA-productizing-arch-separation Phase C

### Acceptance Criteria
- [ ] `arch init --guided` generates `arch.config.json` via interactive prompts (project type, paths override, protocol version) → cmd: echo -e "test-project\n\n\n" | arch init --guided; exit: 0
- [ ] `arch review` lists all `REVIEW` tasks with AC checkboxes and diff summary, accepts `[y/N/edit]` per task → cmd: arch review --help; exit: 0
- [ ] `arch check --auto-fix` auto-corrects minor formatting violations (whitespace, meta line order) and reports what was fixed → cmd: arch check --auto-fix --dry-run; exit: 0
- [ ] `arch review` with `[y]` transitions task to `DONE` and writes `Closed-at` timestamp → file: cli/src/main/ts/commands/review.ts
- [ ] `arch check` passes → cmd: arch check; exit: 0
- [ ] Existing tests pass → cmd: npm test --prefix cli; exit: 0

### Definition of Done
- [ ] Three new CLI subcommands operational
- [ ] `arch check` passes

## Hansei
<!-- Placeholder — to be filled at close per ADR-019 -->
