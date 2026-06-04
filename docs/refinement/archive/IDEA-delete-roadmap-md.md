# IDEA: Delete ROADMAP.md — it competes with the IDEA queue

**Status:** PROMOTED
**Created:** 2026-06-03
**Source:** Protocol audit — ROADMAP.md is a second backlog that diverges from docs/refinement/
**Candidate-class:** 6-writing
**Candidate-size:** XS
**Depends:** none
**Decision:** Pending human review.

## Problem

ROADMAP.md (309 lines) mixes shipped features, speculative features, and NOT STARTED items. It competes with docs/refinement/ IDEAs as a backlog. Decisions in ROADMAP.md are not tracked as tasks. Features listed as NOT STARTED have no governance path — they're wishes, not commitments. Any developer reading the repo sees a ROADMAP.md and an IDEA queue and doesn't know which is authoritative.

## Proposed solution

Delete ROADMAP.md. Move any legitimate NOT STARTED items to docs/refinement/ as IDEA files. The IDEA queue + sprint state + RETRO.md together are the roadmap.

If a generated roadmap view is useful (e.g. for external communication), generate it from the IDEA queue + archive: `arch govern report --roadmap`.

## Validation hints

- ROADMAP.md deleted
- Any legitimate NOT STARTED items migrated to docs/refinement/ as IDEA files
- No orphan references to ROADMAP.md in other docs
