# IDEA: Extract shared abstraction — 3 files share identical signature pattern

**Status:** DRAFT
**Created:** 2026-06-06
**Source:** codebase-scan (boilerplate-pattern)
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Evidence

3 files share the signature shape: `(ArchConfig)`

- cli/src/main/ts/domain/models/config.ts
- cli/src/main/ts/domain/models/config.ts
- cli/src/main/ts/domain/models/config.ts

## Problem

Repeated identical function signatures across multiple files suggest a missing abstraction — an interface, base class, or factory that would make adding new implementations a matter of configuration rather than copy-paste.

## Proposed solution

Define a shared interface or registry for this pattern. New implementations satisfy the interface rather than duplicating the signature manually.
