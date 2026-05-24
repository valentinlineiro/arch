# IDEA: protocol-upgrade-policy — define patch/minor/major upgrade adoption protocol
**Created:** 2026-05-24
**Source:** ROADMAP-IDEAS — protocol-upgrade-policy entry, graduated by THINK 2026-05-24
**Status:** PROMOTED
**Meta:** P2 | S | human | docs/adr/, docs/PROTOCOL-UPGRADES.md

## Problem

When ARCH CLI upgrades, repos face hidden governance drift. The CLI enforces rules the repo hasn't adopted; docs describe rules the CLI no longer implements. No explicit adoption protocol exists. A team running `arch` v1.1 on a v1.2 CLI sees failures they can't diagnose and have no path to resolve without reading release notes.

This is the external adoption bottleneck: ARCH can't be recommended to real teams until upgrades are predictable and non-breaking.

## Proposed Solution

A new file `docs/PROTOCOL-UPGRADES.md` and an ADR (ADR-033) defining:

**Classification:**
- **Patch** (v1.x.y → v1.x.y+1): bug fixes, no protocol changes. No evaluation task required.
- **Minor** (v1.x → v1.x+1): new commands or checks added. Evaluation task required (XS). Adopt at team's pace.
- **Major** (v1 → v2): protocol-breaking changes. Evaluation task required (M). Adopt/defer/reject decision recorded in a new ADR.

**Adoption protocol per version bump:**
1. `arch init --upgrade` detects CLI version delta against repo's `arch.config.json.archVersion`
2. Emits a structured diff: new checks added, old checks removed, config keys changed
3. Creates an evaluation task in `docs/tasks/` (size per classification above)
4. Human closes evaluation task with `Adopt`, `Defer`, or `Reject` in Hansei

**Outcome tracking:** `.arch/protocol-versions.jsonl` — append-only log of adopt/defer/reject decisions with rationale.

## Constraint Axes
- **Dependency ordering:** Requires `arch.config.json.archVersion` field (XS config change)
- **Temporal validity:** Valid — external adoption is blocked by this gap now
- **Abstraction layer:** Correct — policy doc + config field, no new infrastructure
- **Observability validity:** Deterministic — version comparison is reliable
- **Priority displacement:** P2 — important for external adoption, not blocking internal use

## Gaps
- `arch.config.json` needs `archVersion` field (XS config change)
- `arch init --upgrade` subcommand doesn't exist (S)
- `.arch/protocol-versions.jsonl` schema needs definition

## Decision
PROMOTE → TASK-1002
