# IDEA: handle-parallelism
**Created:** 2026-04-30
**Source:** human — `idea:` directive
**Status:** DRAFT
**Meta:** P2 | S | local | docs/agents/

## Problem
Currently, ARCH is designed for sequential execution. If multiple agents or humans work on the repository simultaneously, they may collide on TASK IDs, locks, or state files.

## Proposed solution
Implement a coordination mechanism for parallel agents:
1. Use git-based locking or a central registry to prevent double-locking.
2. Ensure TASK-ID generation is collision-resistant.
3. Define a "merge protocol" for concurrent THINK/DO sessions.

## Dependencies
None

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
