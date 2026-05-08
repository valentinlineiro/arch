# IDEA: Domain packs — protocol extensions for software, startup, household, and personal use
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DRAFT
**Meta:** P3 | XL | claude-code | docs/guidelines/, arch.config.json

## Problem
ARCH's current protocol is implicitly a software engineering system. Its task formats, AC patterns, review criteria, and guidelines are all tuned for code. Applying ARCH to other domains (managing a startup, running a household, personal development) requires manual protocol adaptation that is currently undocumented and unsupported.

## Proposed solution
Define domain packs as composable protocol extensions. Each pack provides: domain-specific task templates, AC patterns, guideline sets, and review criteria. A pack is activated in `arch.config.json`:

```json
"domains": ["software", "startup"]
```

**Software pack** (current implicit default): code tasks, test ACs, ADR requirements for arch changes.

**Startup pack**: strategy tasks, hiring decisions, sales pipeline, roadmap operations. AC patterns focus on outcomes (signed contracts, hired candidates) rather than code.

**Household pack**: inventory, maintenance schedules, recurring tasks, shopping prediction, shared coordination. Tasks have recurrence fields and coordination surfaces.

**Personal pack** (hardest): reflection cycles, goal tracking, energy rhythms, recovery modeling, adaptive planning. Requires the temporal/energy model (Phase 5) as a prerequisite.

## Rationale
The moat is not vertical (deeper software tooling) — it is horizontal (ARCH as the operational layer for all human+AI work). Domain packs are the mechanism for horizontal expansion. The core protocol stays minimal; domain-specific intelligence lives in packs. This prevents ARCH from becoming a bloated monolith while enabling universal applicability. Important constraint: personal pack must not become "Jira for humans" — it must model rhythms and recovery, not just throughput.

## Related IDEAs
- [IDEA-separate-arch-core-from-content.md](IDEA-separate-arch-core-from-content.md) — core/content separation prerequisite
- [IDEA-open-standard-portability.md](IDEA-open-standard-portability.md) — protocol portability
- [IDEA-multi-repo-arch.md](IDEA-multi-repo-arch.md) — multi-repo coordination

## Dependencies
IDEA-roadmap-operational-load (required for personal pack), IDEA-separate-arch-core-from-content.

## Estimated size
XL

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
