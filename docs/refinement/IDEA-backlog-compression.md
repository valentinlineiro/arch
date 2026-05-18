# IDEA: backlog-compression
**Meta:**Source: Phase-3.6 | Status: DRAFT | Sessions: 1
**Created:** 2026-05-18

## Problem
`docs/tasks` currently contains 44 READY tasks, exceeding the 1000-line budget in `Census` check. Many of these tasks may be stale or lower priority.

## Proposed direction
Implement a compression protocol: any READY task untouched for 60+ days or without a P0/P1 priority should be moved to a `docs/refinement/deferred/` directory or archived as DEFERRED.

## Governance class
Class: I
Evaluates: Structural health of the task backlog.
Does NOT evaluate: Whether a specific task is important.
Boundary risk: Low.
