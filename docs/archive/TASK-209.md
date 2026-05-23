## TASK-209: Fix commit message checker to recognize chore: [THINK] as governance tag
**Meta:** P2 | XS | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/domain/services/reviewer.ts | Closed-at: 2026-05-13T13:20:00Z
**Depends:** none

## Hansei
The bug was already partially fixed in a prior session — the `isGovernance` regex was correct but no test covered the `chore: [THINK]` format specifically. A cleaner approach would have been to add these tests at the same time the regex was introduced, not as a retroactive fix.
