## TASK-938: Implement active constraint injection — preflight scan on arch task start
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/commands/task-command.ts, .arch/context-index.json, docs/adr/, docs/tensions/

### Context

ADRs, tensions, and causal patterns are passive: they require explicit query to surface. An agent that skips `arch memory ask` before implementation operates on generic priors. Violations surface at `arch review` — after the commit. Active Constraint Injection shifts this: before IN_PROGRESS is committed, emit the constraints relevant to the task's context files so the agent has them before writing a line of code.

### Non-Goals

- Not a blocker. `arch task start` always proceeds after printing the preflight.
- Not a semantic reasoner. Matching is structural (path overlap, ADR file references) — not embedding similarity.
- No new files written. Preflight is read-only against existing stores, stdout only.
- Preflight must complete in < 500ms. Index-driven lookup only, no full corpus scan.

### Gaps

- **Context index freshness**: preflight reads `.arch/context-index.json`. If the index is stale (last built > N govern ticks ago), the scan may miss recently added files. Decision needed: warn on stale index, or silently proceed with available data?
- **No-match silence**: if a task's context paths have no matching ADRs, tensions, or recent signals, the preflight block should be omitted entirely. Confirmed: no "nothing found" output.
- **Tension scope**: tensions in `docs/tensions/` have an `Affected tasks` field but not always a file scope. Matching tensions to context paths requires reading the tension body, not just the index. Acceptable overhead for M tasks; may need a caching layer for rapid successive starts.

### Acceptance Criteria

- [ ] `arch task start TASK-XXX` emits a `## Constraint Preflight` block to stdout listing: ADRs whose file references overlap the task's Context paths, open tensions whose affected tasks or file scope overlaps, and recent (≤30d) Hansei signals by category for the context paths.  →  prose: verified by running arch task start on a task with known overlapping ADRs and confirming preflight output
- [ ] If no constraints are found for any section, that section is omitted entirely (no "none found" noise).  →  prose: verified by running arch task start on a task with no ADR/tension overlap and confirming no preflight block is printed
- [ ] Preflight completes in < 500ms on a repo with 50+ ADRs.  →  prose: verified by timing arch task start before and after
- [ ] Preflight output goes to stdout only. No writes to INBOX, escalations.jsonl, or the task file.  →  grep: no new append calls in the preflight code path
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0
- [ ] CLI tests pass.  →  cmd: npm test --prefix cli; exit: 0

### Definition of Done

- [ ] An agent running `arch task start` on a task that touches files covered by an ADR sees that ADR's constraint before implementation begins.
- [ ] The preflight is silent when there are no relevant constraints (zero noise overhead on unrelated tasks).
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

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
