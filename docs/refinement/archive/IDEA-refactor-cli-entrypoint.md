# IDEA: Refactor CLI Entrypoint using Clean Architecture
**Created:** 2026-04-27
**Source:** Human suggestion: "refactor cli entrypoint using clean architecture like the rest of the cli"
**Status:** PROMOTED → TASK-071
**Meta:** P2 | S | cli | index.ts

## Problem
The CLI entrypoint (`cli/src/main/ts/index.ts`) contains a large `main()` function with:
- A 90-line switch statement handling all commands
- Mixed presentation logic (colored console output) with business logic
- Direct instantiation of dependencies
- No clear separation between CLI concerns and domain logic

This violates the clean architecture pattern established in the rest of the CLI.

## Proposed solution
1. Extract command handlers into individual files in `application/commands/`
2. Create a CLI-specific presentation layer that calls use-cases
3. Move console output/colors to an `output-formatter.ts` in infrastructure
4. Implement command parser as a separate component
5. Keep index.ts as minimal bootstrap (DI wiring + command dispatch only)

## Dependencies
- None (self-contained refactor)

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->