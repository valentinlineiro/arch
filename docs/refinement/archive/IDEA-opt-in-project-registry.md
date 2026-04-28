# IDEA: Opt-in project registry
**Created:** 2026-04-27
**Source:** Kaizen — no feedback loop from scaffolded repos back to ARCH
**Status:** PROMOTED → TASK-095, TASK-096
**Meta:** P3 | M | local | scripts/, .github/workflows/

## Problem
No feedback loop from scaffolded repos back to ARCH. Convergence patterns (which routing agents are used, which guidelines are popular, version distribution) are invisible, making roadmap decisions data-free.

## Proposed solution
A minimal opt-in registry: at scaffold time, generate a `registry.json` in the repo and publish it to a static GitHub Pages aggregate endpoint. Users opt-in via CLI flag (`arch init --opt-in-telemetry`) or initializr checkbox. No backend — static JSON only, aggregated by a daily GitHub Action.

## Dependencies
None.

## Estimated size
M

## Gaps
- "Hash-only" privacy is underspecified — what exactly is hashed? (URL, domain, random UUID?)
- Aggregation infrastructure (GitHub Action writing to gh-pages branch) is a separate deliverable that should be its own task.
- Value proposition is unclear for a single-user local tool; this is more relevant as a public SaaS offering — needs a decision on whether ARCH is targeting that audience.
- `arch init --opt-in-telemetry` flag doesn't exist yet; adds scope to the CLI.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
