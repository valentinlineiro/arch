# IDEA: Typed protocol schema — replace prose instruction-following with ARCH.schema.json
**Created:** 2026-04-30
**Source:** Strategic vision — prose protocols are interpreted differently on every run; behavioral drift is undetectable
**Status:** DRAFT
**Meta:** P1 | XL | local | docs/agents/, arch.config.json, cli/src/

## Problem
THINK.md and DO.md are prose instructions that an AI interprets on every run. Each interpretation is slightly different, subject to model drift, context noise, and prompt sensitivity. There is no executable specification of what a valid protocol run looks like. When behavior changes (due to model update, context change, or protocol edit), the change is invisible until it causes a failure.

## Proposed solution
Define ARCH as a typed state machine in `arch.schema.json`:
- All valid task statuses and legal transitions (e.g. READY → IN_PROGRESS is legal; DONE → IN_PROGRESS requires human approval)
- All valid meta fields with types and allowed values
- All protocol rules as machine-readable constraints

The AI agent does not follow prose; a thin interpreter reads the schema and drives behavior. THINK.md and DO.md become human-readable companions to the schema, not the authoritative source.

Long term: `arch validate` checks any operation against the schema before execution. The schema is versioned independently of the prose. Breaking changes to the schema require a MAJOR version bump with a migration script.

## Dependencies
IDEA-protocol-as-code (Phase 1 delegation to CLI is a prerequisite step toward this).

## Estimated size
XL — must be decomposed before entering READY.

## Gaps
- Define the schema format (JSON Schema, TypeScript types, or a custom DSL).
- Decide migration path for existing tasks and config when schema changes.
- Determine how the interpreter handles schema rules the AI must still resolve with judgment (e.g. "which task has highest priority?" is not fully deterministic).

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
