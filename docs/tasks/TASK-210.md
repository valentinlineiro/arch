## TASK-210: Add Intent domain model
**Meta:** P2 | XS | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/domain/models/intent.ts
**Depends:** none

### Context
First task of 7 implementing `arch capture`. Creates the core domain types for the INTENT entity: `IntentStatus` enum and `Intent`/`IntentOrigin` interfaces.

### Acceptance Criteria
- [x] `IntentStatus` enum with CAPTURED, PROMOTED, SIGNAL, SUPERSEDED, DISCARDED values → test: `npm test` in `cli/`
- [x] `Intent` interface with all required fields → code: `cli/src/main/ts/domain/models/intent.ts`
- [x] `IntentOrigin` interface defined → code: verified

### Definition of Done
- [x] All ACs checked.
- [x] `npm test` passes in `cli/`.
