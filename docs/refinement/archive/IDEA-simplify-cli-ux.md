# IDEA: simplify-cli-ux
**Created:** 2026-04-29
**Source:** human feedback — "ARCH is an autonomous protocol... should be easier to operate."
**Status:** DRAFT
**Meta:** P2 | S | local | cli/, docs/agents/
<!-- cli: local | claude | gemini | human -->

## Problem
The current CLI has many atomic commands (`status`, `validate`, `next`, `govern`, `rank`, `inbox`, `conduct`, `exec`) which reflects the internal modularity but creates a high cognitive load for the human operator. ARCH's value is in its autonomy, yet the human still needs to remember specific sequences to drive the system.

## Proposed solution
Consolidate the command surface to reflect the **intent** and **autonomy level** rather than the internal step.
- **`arch sync`**: A unified command that runs `status`, `review`, and `inbox` (the "Context Phase").
- **`arch move`**: Combined `govern` and `next` (the "Strategic Phase").
- **`arch loop`**: A high-autonomy mode that automatically runs `conduct` -> `govern` -> `exec` until the backlog is clear or a human intervention is required.
- **`arch task [id]`**: Unified entry point for starting, finishing, or rejecting a task.

The goal is to move from "Tool Orchestration" to "System Guidance."

## Dependencies
None

## Estimated size
S

## Gaps
- `arch sync` and `arch move` introduce new names that break established vocabulary and would require users and documentation to relearn the surface.
- `arch loop` already exists and covers the high-autonomy intent this IDEA proposes.
- Root problem superseded by `IDEA-consolidate-cli-commands`, which merges redundant commands into existing names rather than renaming the whole surface.

## Decision
REJECT: superseded by IDEA-consolidate-cli-commands
