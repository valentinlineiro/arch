## PROJECT: ARCH

## Definition of Done
- [ ] All active sprint tasks are DONE or archived
- [ ] No P0 or P1 tasks in READY or IN_PROGRESS for more than 7 days

## Core Flows
- [ ] CLI unit tests pass — regression guard for all core flows
  - `cmd: npm test --prefix cli; exit: 0`
- [ ] Structural validation passes — integrity review must be clean
  - `cmd: node cli/dist/index.js review; exit: 0`
