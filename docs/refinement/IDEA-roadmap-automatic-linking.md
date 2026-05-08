# IDEA: Automatic entity linking — tasks, commits, ADRs, and guidelines auto-connect
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DRAFT
**Meta:** P1 | M | claude-code | cli/src/main/ts/domain/

## Problem
Relationships between ARCH entities exist implicitly in commit messages, task references, and ADR citations — but are never materialized. An agent wanting to know "which commits implemented TASK-102?" or "which tasks cite ADR-004?" must grep manually, and the answer is never guaranteed complete.

## Proposed solution
ARCH automatically links entities at write time and index time:
- Tasks ↔ commits (via commit message TASK-ID refs)
- ADRs ↔ tasks (via task `Depends` and ADR references in task context)
- Guidelines ↔ failures (via retro and KAIZEN-LOG entries)
- Retros ↔ patterns (via recurring failure signatures)

Links are stored in the context index (from TASK-210) and surfaced in task context feedback and `arch ask` queries.

## Rationale
If the user has to link entities manually, the system loses. Automatic linking is what turns ARCH from a folder of markdown into a connected knowledge graph. Every manual link that ARCH fails to create is friction that accumulates into abandonment.

## Dependencies
TASK-210 (Auto Context Engine / ContextIndex).

## Estimated size
M

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
