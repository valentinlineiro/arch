# IDEA: Prune stale documentation and consolidate course material
**Created:** 2026-04-29
**Source:** THINK Phase 4 (Autonomous Replenishment)
**Status:** DRAFT
**Meta:** P3 | S | gemini | docs/, docs/course/

## Problem
There is potential redundancy between the high-level `docs/*.md` files and the newer `docs/course/` directory. This increases cognitive load for new contributors and risks documentation drift.

## Proposed solution
Audit `docs/` and `docs/course/` to identify overlapping content. Consolidate core "how-to" and "what-is" content into `docs/course/` and maintain `docs/` for ephemeral or protocol-specific files (AGENTS.md, TASK-FORMAT.md, etc.).

## Dependencies
None

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->

## Decision
REJECT: The overlap between docs/*.md and docs/course/ is intentional — course/ is onboarding, docs/ is operational reference. They serve different audiences at different points in the decision cycle. Pruning them conflates reference documentation with learning material. If specific duplication causes real confusion, raise it as a concrete issue with file citations.
