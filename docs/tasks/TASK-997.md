## TASK-997: GovernTransaction: atomic .arch/ writes to eliminate partial-state corruption
**Meta:** P2 | S | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/govern-system.ts, .arch/

**Depends:** none

### Context

`arch govern` writes multiple files to `.arch/` (focus-ledger, context-index, causal-signal, etc.) as separate I/O operations. If interrupted mid-tick, state is partially written and the git commit hasn't happened. On the next govern run, the diff check sees modifications to protected state files outside any committed transaction — triggering false INTEGRITY violations. Source: TASK-258 Hansei H3b. Sessions: 5. Decision-required.

### Acceptance Criteria

- [ ] `GovernTransaction` class buffers all `.arch/` `writeFile` calls during a govern tick in memory.
  - `file: cli/src/main/ts/application/use-cases/govern-transaction.ts`

- [ ] All `.arch/` writes in `govern-system.ts` use the transaction buffer instead of direct `fileSystem.writeFile` calls.
  - `prose: verified by reading govern-system.ts — no direct .arch/ writes outside transaction`

- [ ] Transaction flushes atomically before the `git commit` step that closes the tick. If any write fails, no files are written and no commit is made.
  - `prose: verified by interruption test — no partial state`

- [ ] `arch check` passes after govern runs with the transaction.
  - `cmd: node cli/dist/index.js check; exit: 0`

- [ ] `npm test` passes.
  - `prose: 590+ tests pass`
