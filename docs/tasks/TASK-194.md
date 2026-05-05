## TASK-194: Implement HALT.md and halt-log drift check
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | docs/agents/DO.md, docs/TASK-FORMAT.md, cli/src/main/ts/domain/services/drift-checker.ts
**Depends:** none

### Context
... (rest of context)

### Acceptance Criteria
... (rest of ACs)

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Hansei
Implementing the `HaltPolicy` check revealed a small friction point in the build process: the CLI needs to be rebuilt (`npm run build`) for the changes in `DriftChecker` to be reflected in the `./scripts/arch.sh review` command (which runs the minified dist). I initially missed adding the check to the `Promise.all` array, which was caught during manual verification. Centralizing the halt conditions in `HALT.md` provides a much cleaner reference for future agent implementations.
