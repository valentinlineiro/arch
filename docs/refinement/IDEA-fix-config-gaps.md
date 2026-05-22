# IDEA: fix-config-gaps
**Created:** 2026-05-22
**Source:** ARCH protocol review — arch.config.json missing XL Muri, models.md documents non-existent key
**Status:** DRAFT
**Meta:** P2 | S | local | arch.config.json, docs/guidelines/models.md | Sessions: 2
**Decision-required:** yes

## Problem

Two config-level drifts found during protocol review:

**1. XL size has no Muri guard:**
`arch.config.json` Muri thresholds are defined for XS, S, M, L only. No XL entry exists. Yet TASK-FORMAT.md's Meta regex includes `XL` as a valid size, and core.md says XL must be decomposed before READY status. While XL should ideally never enter execution (it must be decomposed first), there's no mechanical guard preventing an XL task from being set to IN_PROGRESS and consuming unbounded turns/cost.

**2. models.md references non-existent `modelTiers` key:**
`docs/guidelines/models.md:13` documents `"modelTiers"` as the config schema:
```json
"modelTiers": { "M": "sonnet" }
```
But `arch.config.json` uses `"strategies"` with a completely different structure (nested provider arrays with `provider`/`model` objects). Either models.md is stale or the config was restructured without doc update.

## Proposed solution

**For XL Muri:** Either (a) add an XL entry to `arch.config.json` with reasonable limits (e.g., turns: 200, cost: 5.0) as a safety net, or (b) add a config-level check that rejects XL tasks from entering IN_PROGRESS (enforce the "decompose before READY" rule mechanically).

**For models.md:** Rewrite the examples to match the actual `strategies` schema in arch.config.json. Document the structure: nested objects keyed by class → size → array of `{provider, model}` objects.

## Dependencies
None.

## Estimated size
S — documentation + config change.

## Gaps

## Decision
