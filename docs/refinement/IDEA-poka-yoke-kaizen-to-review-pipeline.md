# IDEA: Formalize POKA-YOKE rule — every recurring KAIZEN error must produce an arch review check
**Created:** 2026-04-30
**Source:** Human proposal (Poka-Yoke / Mistake-Proofing) — Kaizen identifies patterns but enforcement pipeline is informal
**Status:** DRAFT
**Meta:** P2 | XS | local | docs/guidelines/bugs.md, docs/KAIZEN-LOG.md

## Problem
When THINK Phase 3 identifies a recurring error pattern (e.g. commits missing `[TASK-ID]`), it logs it in `KAIZEN-LOG.md` and may propose a task. But there is no rule requiring that recurring errors eventually produce a deterministic check in `arch review`. The Kaizen → enforcement pipeline is informal and depends on a human remembering to close the loop.

## Proposed solution
Add a Poka-Yoke rule to `docs/guidelines/bugs.md`:

> **Poka-Yoke:** Any error pattern that appears 2+ times in `KAIZEN-LOG.md` must have a corresponding `arch review` check implemented before the pattern is considered resolved. A Kaizen entry is only "closed" when either (a) an `arch review` check prevents the error, or (b) the pattern is explicitly accepted as a known trade-off with a documented rationale.

This makes `arch review` the canonical enforcement layer and gives every Kaizen entry a clear exit condition.

## Dependencies
None.

## Estimated size
XS

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
