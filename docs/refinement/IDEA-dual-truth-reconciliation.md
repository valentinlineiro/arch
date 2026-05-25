# IDEA: Dual-truth reconciliation for INBOX and live state
**Created:** 2026-05-25
**Source:** Human structural review
**Status:** DRAFT
**Meta:** P0 | M | local | docs/refinement/

## Problem
INBOX.md is simultaneously "human-only" (invariant) and machine-written (agents append to it). The append-only guarantee means the static file and the live computed view diverge monotonically. TENSION-006 names the problem but does not fix it. There is no reconciliation mechanism, no diff, no merge. Both surfaces are authoritative in different ways; neither is trustworthy alone. TASK-1019 addresses the READY count symptom but not the structural contradiction.

## Proposed solution
Resolve the invariant contradiction by splitting INBOX into two artifacts with distinct ownership: (1) a machine-generated summary block (`docs/INBOX-summary.md`) regenerated on every govern tick from live state — authoritative for counts and projections; (2) the human annotation layer (existing `docs/INBOX.md`) which only receives human-written content. Agents write to (1), never to (2). Humans read both; the summary is always fresh.

## Dependencies
- TASK-1019 (INBOX regen wired into govern — addresses the immediate count drift; this IDEA addresses the structural ownership split)
- IDEA-generated-docs-coupling (same root cause: prose artifacts decoupled from state)

## Estimated size
M

## Gaps

## Decision
