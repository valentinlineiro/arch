# IDEA: Approval entry check in arch review
**Created:** 2026-05-05
**Source:** Split from IDEA-mechanize-protocol-controls
**Status:** DRAFT
**Sessions:** 3
**Meta:** P2 | S | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, docs/TASK-FORMAT.md, docs/agents/DO.md

## Problem
DONE tasks require human approval before archival (per DO.md), but there is no structured approval artifact in the task file. The approval exists only in conversation or commit messages, making it unverifiable by `arch review`.

## Proposed solution
1. Define an `## Approval` section in `TASK-FORMAT.md` with a required format: `Approved-by: <role> | <date>`.
2. Update DO.md close step to mandate writing this section before transitioning to DONE.
3. Add an `ApprovalPresent` drift check to `DriftChecker`: scan `docs/archive/*.md` for DONE tasks missing a valid `## Approval` section.

## Dependencies
- Requires a decision on what "approval" means for autonomous tasks (Auditor role writes it, or human confirms via a structured commit message). Without this decision the format is ambiguous.

## Estimated size
S

## Gaps
- Format decision needed: who writes `## Approval` for tasks closed autonomously vs. human-reviewed tasks? This is a governance question, not an implementation question.

## Decision
<!-- Human writes here after THINK evaluation -->
