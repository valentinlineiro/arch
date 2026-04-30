# IDEA: Add Hansei (self-reflection) section to archived tasks
**Created:** 2026-04-30
**Source:** Human proposal (Hansei / Toyota self-reflection) — closed tasks capture what was done but not what could have been better
**Status:** DRAFT
**Meta:** P2 | S | local | docs/TASK-FORMAT.md, docs/agents/DO.md

## Problem
When a task is archived as DONE, the file captures the implementation but not the reflection. Patterns — sizing errors, unexpected blockers, cleaner approaches found too late — are lost. This is the raw material that ORACLE (distillation) and Kaizen need to improve future work, but it currently exists only informally in commit messages or PR descriptions.

## Proposed solution
Add an optional `## Hansei` section to TASK-FORMAT.md, written by the agent at task close before archiving. Required only when:
- Sizing delta: estimated size ≠ actual effort (any tier difference).
- Blocker encountered during execution.
- Task size is M or larger.

Format: one to three sentences maximum. Prompt: *"One thing done poorly or one way this could have been cleaner."* Keeping it constrained prevents formulaic entries.

DO.md close step: before setting status to DONE, check if any of the three Hansei triggers apply and write the section if so.

## Dependencies
None — compatible with current TASK-FORMAT.md structure.

## Estimated size
S

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
