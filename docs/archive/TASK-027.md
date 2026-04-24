## TASK-027: CLI Migration — Node.js + TypeScript + Clean Architecture
**Meta:** P0 | L | DONE | Sprint 1 | 2-code-generation | claude-code | scripts/, package.json, docs/TASK-FORMAT.md
**Depends:** TASK-024

### Acceptance Criteria
- [x] Node.js (v20+) project initialized with TypeScript.
- [x] Explicit layers established: Domain (Entities), Application (Use Cases), and Infrastructure (Adapters).
- [x] Logic for 'arch' commands ported to independent Use Case classes.
- [x] Infrastructure ensures node_modules is ignored during file system operations.
- [x] Domain-level tests implemented for core task logic.
- [x] Native TASK-FORMAT v0.2 validation logic (regex-based) as a Domain Service.
- [x] Bundle process (esbuild/tsup) created for zero-dep redistribution.

### Definition of Done
- [x] 'arch' command in package.json points to the new Node/TS implementation.
- [x] Full suite of automated tests passing.
- [x] PR approved.