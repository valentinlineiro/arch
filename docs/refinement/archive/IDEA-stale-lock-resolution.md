# IDEA: Define stale lock resolution action in THINK Phase 1
**Created:** 2026-04-30
**Source:** Protocol audit — THINK Phase 1 detects stale locks but defines no response
**Status:** PROMOTED
**Meta:** P1 | XS | local | docs/agents/THINK.md

## Problem
THINK Phase 1 instructs the agent to "evaluate stale locks (>3 days)" but specifies no action to take. Detection without a defined response is dead weight — the agent reads the signal, has nowhere to route it, and outputs nothing useful.

## Proposed solution
Add a concrete resolution step to THINK Phase 1: if a stale lock is detected, create a bug task in `docs/tasks/` with priority P1, status READY, and a description citing the stale task ID and lock age. This follows the existing bug protocol (bugs.md) and gives the signal a defined lifecycle.

## Dependencies
None.

## Estimated size
XS

## Gaps

## Decision
PROMOTE → TASK-144
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
