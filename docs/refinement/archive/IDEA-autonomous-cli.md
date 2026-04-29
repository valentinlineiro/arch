# IDEA: Autonomous CLI command with human intervention on block
**Created:** 2026-04-28
**Source:** User requested CLI that lets arch operate alone and only interrupt on block
**Status:** REJECT: superseded by incremental CLI fallback work
**Meta:** P2 | S | cli | local

## Problem
Current arch commands (conduct, exec) require full API quota and human oversight for every operation. Users want autonomous operation that self-heals but stops for human help when blocked.

## Proposed solution
1. New command: `arch auto` — runs autonomously in a loop
2. Selects next READY task, implements it, runs review
3. On failure: check if fixable (retry, skip, or create bug task)
4. If blocked (API quota, dependency, unclear): pause and ask human
5. Continue until no more tasks or human says stop

## Dependencies
- None

## Estimated size
M

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->