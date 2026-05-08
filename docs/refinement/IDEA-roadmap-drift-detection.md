# IDEA: Drift detection — two-tier structural and semantic integrity checks
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DECIDED
**Meta:** P1 | M | claude-code | cli/src/main/ts/domain/services/drift-checker.ts

## Problem
ARCH accumulates structural debt silently: orphan tasks, dead references, unapplied ADRs, stale guidelines, contradictory rules. Without systematic detection, entropy grows undetected across sessions.

## Proposed solution
A two-tier drift checker integrated into `arch review`: Tier 1 checks structural invariants (task format, path integrity, dependency graph); Tier 2 checks semantic integrity (orphan tasks, dead context, unapplied ADRs, obsolete guidelines).

## Rationale
Organizational collapse happens when coordination surfaces lag reality. Drift detection prevents this by making entropy visible at zero cost — every session starts with a clean integrity report.

## Dependencies
None.

## Estimated size
M

## Gaps

## Decision
PROMOTE → ADR-013, TASK-215
