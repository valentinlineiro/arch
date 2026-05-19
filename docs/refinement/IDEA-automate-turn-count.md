# IDEA: automate-turn-count
**Meta:**Source: Phase-3.6 | Status: DRAFT | Sessions: 3 | **Decision-required:** yes
**Created:** 2026-05-18

## Problem
`Turns: N` metadata is currently manual and often omitted, leading to loss of cycle-time signal.

## Proposed direction
Harden the Auditor or `mark-task-done` to derive the turn count automatically using `git rev-list --count lockedCommit..HEAD`.

## Governance class
Class: I
Evaluates: Structural completeness of task metadata.
Does NOT evaluate: Semantic quality of the turns.
Boundary risk: Low.
