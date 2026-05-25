# IDEA: status-doc-refresh
**Created:** 2026-05-18
**Source:** Human request to turn the current ARCH status assessment into user-facing documentation
**Status:** DRAFT
**Meta:** P3 | XS | claude | README.md, docs/ROADMAP.md

## Problem
The repo's public-facing status framing is stale in two places:

- `README.md` still describes ARCH primarily as "Causal Memory + Conditioned Retrieval"
- `docs/ROADMAP.md` still describes the `arch govern` / `arch reflect` split as not yet structurally implemented

That no longer matches the actual repo state. ARCH is now better described as an operational alpha: daily-usable for disciplined, git-native teams, with the remaining `1.0.0` gap centered on governance surface cleanliness rather than command viability.

## Proposed solution
Refresh the status language in `README.md` and `docs/ROADMAP.md` so they match the current state:

1. describe ARCH as an operational alpha
2. distinguish current strengths from the remaining `1.0.0` gap
3. update the roadmap language so the govern/reflect split is treated as implemented, with residual work framed as boundary hardening

## Dependencies
none

## Estimated size
XS

## Gaps

## Decision
PROMOTE → TASK-971 (materialized reporting layer, archived). Status framing handled there.
