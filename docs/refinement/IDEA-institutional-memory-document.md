# IDEA: Institutional memory document — distill KAIZEN-LOG into durable principles
**Created:** 2026-04-30
**Source:** Strategic vision — KAIZEN-LOG is an event log; durable wisdom requires distillation into a living principles document
**Status:** DRAFT
**Meta:** P2 | M | claude | docs/KAIZEN-LOG.md, docs/guidelines/

## Problem
`KAIZEN-LOG.md` records what happened — friction events, detected patterns, proposed fixes. It is an event log. Over time it grows into an unreadable history that agents and humans must scan in full to extract relevant guidance. The institutional wisdom accumulated across sprints is buried in chronological noise. There is no "What We Know" document — only "What We Observed."

## Proposed solution
Create `docs/PRINCIPLES.md` — a living document of durable, human-approved principles distilled from KAIZEN-LOG entries. Structure:

```
## [Principle title]
**Source:** KAIZEN-LOG entries [sprint refs]
**Status:** ACTIVE | SUPERSEDED
**Rule:** [one-sentence actionable rule]
**Rationale:** [why this matters, evidence it was validated]
```

ORACLE (IDEA-oracle-archive-distillation) proposes candidate principles as IDEA drafts after each 50-task distillation cycle. The human promotes the durable ones to PRINCIPLES.md. Entries that are superseded (principle proved wrong or obsolete) are not deleted — they are marked SUPERSEDED with a reference to the replacing principle.

THINK Phase 3 reads PRINCIPLES.md (not KAIZEN-LOG) as its primary Kaizen context. KAIZEN-LOG remains for auditability but stops being the primary guidance source.

## Dependencies
IDEA-oracle-archive-distillation (proposes candidate principles from archive distillation).

## Estimated size
M

## Gaps
- Define the minimum evidence threshold for promoting a Kaizen observation to a PRINCIPLE (1 sprint? 3 occurrences? human judgment only?).
- Decide whether PRINCIPLES.md is loaded into every agent context by default or only during THINK Phase 3.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
