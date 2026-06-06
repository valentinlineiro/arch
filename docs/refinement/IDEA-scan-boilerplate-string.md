# IDEA: Extract shared abstraction — 20 files share identical signature pattern

**Status:** DRAFT
**Created:** 2026-06-06
**Source:** codebase-scan (boilerplate-pattern)
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Evidence

20 files share the signature shape: `(string)`

- cli/src/main/ts/application/commands/status-command.ts
- cli/src/main/ts/application/commands/task-command.ts
- cli/src/main/ts/application/use-cases/build-index.ts
- cli/src/main/ts/application/use-cases/focus-ledger.ts
- cli/src/main/ts/application/use-cases/weak-signal-checker.ts
- cli/src/main/ts/domain/services/command-registry.ts
- ...and 14 more

## Problem

Repeated identical function signatures across multiple files suggest a missing abstraction — an interface, base class, or factory that would make adding new implementations a matter of configuration rather than copy-paste.

## Proposed solution

Define a shared interface or registry for this pattern. New implementations satisfy the interface rather than duplicating the signature manually.
