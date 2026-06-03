# IDEA: Merge ARCH-CORE.md into AGENTS.md — eliminate competing entry points

**Status:** DRAFT
**Created:** 2026-06-03
**Source:** Protocol audit — ARCH-CORE.md and AGENTS.md serve overlapping purposes
**Candidate-class:** 6-writing
**Candidate-size:** XS
**Depends:** none
**Decision:** Pending human review.

## Problem

ARCH-CORE.md (117 lines) is the "minimal execution contract" — load for execution-only sessions. AGENTS.md (150 lines) is the "universal entry point." Both claim to be the starting point. An agent reading the repo sees two competing entry documents with no clear rule for which to load. The split was motivated by context-window economy, but AGENTS.md already has a section structure that accommodates different load modes.

## Proposed solution

Merge ARCH-CORE.md execution steps into AGENTS.md as a collapsible or clearly-demarcated section. Keep AGENTS.md as the single authoritative entry point. Delete ARCH-CORE.md. Update any cross-references.

## Validation hints

- Only one file claims to be the agent entry point
- arch init references AGENTS.md, not ARCH-CORE.md
