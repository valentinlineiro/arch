# IDEA: Kaizen learning from review mistakes
**Created:** 2026-04-28
**Source:** human
**Status:** DRAFT
**Meta:** P1 | S | 7-operations | docs/agents/THINK.md, docs/KAIZEN-LOG.md

## Problem
Currently, `arch review` identifies deterministic failures, but there is no structured mechanism for the THINK agent to automatically absorb these mistakes into `KAIZEN-LOG.md` or updated guidelines, beyond general Phase 3 qualitative context. Mistakes found during review are high-signal data points for protocol hardening.

## Proposed solution
When a review is done and mistakes are found (e.g., pending ACs on archived tasks, large git diffs), Kaizen should learn from them. The THINK protocol should be updated to explicitly analyze the output of the last `arch review` failures and propose specific hardening steps in `docs/KAIZEN-LOG.md` or guideline refinements to prevent recurrence.

## Dependencies
none

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
