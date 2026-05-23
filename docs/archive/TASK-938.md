## TASK-938: Implement active constraint injection - preflight scan on arch task start
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/commands/task-command.ts, .arch/context-index.json, docs/adr/, docs/tensions/
**Closed-at:** 2026-05-18T23:30:00Z

## Hansei
**Severity:** H0
**Category:** [SymbolDiscovery]

**Decision:**
Preflight is advisory-only and stdout-only by design. The temptation to make it blocking or to write conflict advisories to escalations.jsonl was explicitly rejected: a false-positive preflight block would be more damaging than no preflight at all.

**Constraint:**
Context index freshness is an open gap. If the index is stale, the preflight silently misses constraints — which is the same as not having the feature. The gap is acceptable for the first implementation; a staleness warning can be added in a follow-on.

**Cost:**
Each `arch task start` now has a read path against ADRs, tensions, and causal signals. If any of those stores grows large, the < 500ms budget may require a caching layer. Deferred until the budget is actually exceeded.

**Forward Action:**
After shipping, measure preflight latency on the current corpus. If > 200ms average, pre-compute an ADR constraint index during govern ticks.

## Approval
Approved-by: Auditor | 2026-05-18
