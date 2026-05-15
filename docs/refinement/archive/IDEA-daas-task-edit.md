# IDEA: `arch task edit` — Interactive Metadata Management
**Created:** 2026-05-15
**Source:** DaaS Vision
**Status:** DRAFT
**Meta:** P1 | S | local | cli/src/main/ts/

## Problem
The `**Meta:**` line in ARCH tasks is a high-discipline regex-based string. Manually editing it (e.g., changing `P2` to `P1` or updating `Context`) is brittle and often causes `arch review` failures due to formatting errors.

## Proposed solution
Implement `arch task edit TASK-XXX` as an interactive CLI command.

**Workflow:**
1.  `arch task edit TASK-064`
2.  CLI displays current values and prompts for changes:
    - Priority (P0-P3)
    - Size (XS-XL)
    - Status (READY, BLOCKED, etc.)
    - Class (Select from registry)
    - Context (Comma-separated paths)
3.  CLI validates the new values against the `TaskValidator`.
4.  CLI updates the file directly and commits the change with a `chore: update metadata for TASK-XXX` message.

## Rationale
Reduces the "brittleness" of the markdown interface. The human provides the *intent* (higher priority), and the CLI provides the *discipline* (correct formatting).

## Dependencies
`TaskValidator.ts`, `MarkdownTaskRepository.ts`.

## Estimated size
S

## Decision
PROMOTE → TASK-889

