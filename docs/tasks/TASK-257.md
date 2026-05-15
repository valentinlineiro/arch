## TASK-257: Lightweight trusted-metrics refresh on task closure and govern ticks
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/application/use-cases/govern-system.ts, cli/src/main/ts/application/commands/report-command.ts, docs/METRICS.md

### Context

`arch report` generates the full metrics output including Experimental metrics and Epistemic Digest. After TASK-251, it was split into Trusted and Experimental sections, but it still runs only on explicit invocation. The canonical (Trusted) metrics will drift stale between explicit `arch report` runs.

The target behavior (from TASK-254 decisions):
- **Lightweight refresh**: runs automatically after each task closure (`mark-task-done`) and on every `arch govern` tick. Updates only the Trusted section of `docs/METRICS.md` (Completed Tasks, REVIEW_FAIL Rate, Cycle Time). Does not compute Experimental metrics.
- **Full report (`arch report`)**: unchanged — on-demand only, generates both sections with Epistemic Digest.

The lightweight refresh should be fast enough to not add meaningful latency to task closure. It reads only the archive count and EVENTS.md (for REVIEW_FAIL Rate). Cycle Time requires archive timestamp scanning — acceptable if bounded.

### Acceptance Criteria

- [ ] A `LightweightMetricsRefresh` use case (or equivalent) computes only the three canonical metrics: Completed Tasks, REVIEW_FAIL Rate, and Cycle Time by size.  →  grep: "LightweightMetrics\|lightweight.*metrics\|trustedMetrics" cli/src/main/ts/application/use-cases/
- [ ] `mark-task-done.ts` calls the lightweight refresh after successful task closure. Refresh failure is non-fatal and does not roll back task closure.  →  prose: verified by reading mark-task-done.ts post-close call and error handling
- [ ] `govern-system.ts` calls the lightweight refresh on each tick. Refresh failure is non-fatal and does not fail the govern tick.  →  prose: verified by reading govern-system.ts tick completion logic
- [ ] The lightweight refresh updates only the `### Trusted Metrics` and `### Cycle Time` sections of `docs/METRICS.md`, leaving the `### Experimental Metrics` section and Epistemic Digest unchanged.  →  prose: verified by inspecting METRICS.md after a task closure — Experimental section is preserved
- [ ] `arch report` (full) continues to work as before and regenerates all sections.  →  prose: verified by running arch report and inspecting output
- [ ] CLI tests cover: refresh runs after task closure, refresh failure does not revert closure, govern tick triggers refresh, Experimental section is preserved after lightweight refresh.  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [ ] Closing a task updates `docs/METRICS.md` Trusted section without invoking `arch report`.
- [ ] A govern tick updates `docs/METRICS.md` Trusted section.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Gaps

- **Cycle Time in lightweight path**: Cycle Time requires scanning archive timestamps, which may be slow on large archives. Decide: (a) include Cycle Time in the lightweight refresh (acceptable cost at current archive size), or (b) update only Completed Tasks and REVIEW_FAIL Rate in the lightweight path and leave Cycle Time to full `arch report`. Decision should be explicit in the implementation — not left to the implementing agent's judgment.
- **METRICS.md partial-update safety**: The current `updateMetricsFile` in `report-command.ts` replaces the entire `GENERATED:START/END` block. A lightweight refresh that replaces only the Trusted section needs a more surgical update mechanism. Needs a design for partial section replacement without corrupting the Experimental section.
- **Refresh on govern vs. refresh after closure**: These two triggers have different frequencies. Govern runs at most once per explicit invocation; task closure happens per task. Clarify whether both always trigger a refresh, or whether the govern refresh only runs if no task was closed in the same session.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Lightweight refresh is scoped to the three Trusted metrics only. Experimental metrics computation remains exclusively in `arch report` to avoid adding arbitration and calibration cost to the normal execution path.

**Constraint:**
Partial update of METRICS.md (only the Trusted section) requires a new update path in the report infrastructure. The existing full-replace mechanism cannot be reused without modification.

**Cost:**
Two update paths for METRICS.md (lightweight + full) must remain consistent. If `arch report` and the lightweight refresh produce different Trusted section formats, METRICS.md will drift. The format must be shared or the lightweight refresh must delegate format rendering to `report-command.ts`.
