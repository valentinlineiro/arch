## TASK-257: Lightweight trusted-metrics refresh on task closure and govern ticks
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/application/use-cases/govern-system.ts, cli/src/main/ts/application/commands/report-command.ts, docs/METRICS.md
**Closed-at:** 2026-05-15T00:00:00Z

### Context

`arch report` generates the full metrics output including Experimental metrics and Epistemic Digest. After TASK-251, it was split into Trusted and Experimental sections, but it still runs only on explicit invocation. The canonical (Trusted) metrics will drift stale between explicit `arch report` runs.

The target behavior (from TASK-254 decisions):
- **Lightweight refresh**: runs automatically after each task closure (`mark-task-done`) and on every `arch govern` tick. Updates only the Trusted section of `docs/METRICS.md` (Completed Tasks, REVIEW_FAIL Rate, Cycle Time). Does not compute Experimental metrics.
- **Full report (`arch report`)**: unchanged — on-demand only, generates both sections with Epistemic Digest.

The lightweight refresh should be fast enough to not add meaningful latency to task closure. It reads only the archive count and EVENTS.md (for REVIEW_FAIL Rate). Cycle Time requires archive timestamp scanning — acceptable if bounded.

### Acceptance Criteria

- [x] A `LightweightMetricsRefresh` use case (or equivalent) computes only the three canonical metrics: Completed Tasks, REVIEW_FAIL Rate, and Cycle Time by size.  →  grep: "LightweightMetrics\|lightweight.*metrics\|trustedMetrics" cli/src/main/ts/application/use-cases/
- [x] `mark-task-done.ts` calls the lightweight refresh after successful task closure. Refresh failure is non-fatal and does not roll back task closure.  →  prose: verified by reading mark-task-done.ts post-close call and error handling
- [x] `govern-system.ts` calls the lightweight refresh on each tick. Refresh failure is non-fatal and does not fail the govern tick.  →  prose: verified by reading govern-system.ts tick completion logic
- [x] The lightweight refresh updates only the `### Trusted Metrics` and `### Cycle Time` sections of `docs/METRICS.md`, leaving the `### Experimental Metrics` section and Epistemic Digest unchanged.  →  prose: verified by inspecting METRICS.md after a task closure — Experimental section is preserved
- [x] `arch report` (full) continues to work as before and regenerates all sections.  →  prose: verified by running arch report and inspecting output
- [x] CLI tests cover: refresh runs after task closure, refresh failure does not revert closure, govern tick triggers refresh, Experimental section is preserved after lightweight refresh.  →  cmd: npm test --prefix cli; exit: 0
- [x] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [x] Closing a task updates `docs/METRICS.md` Trusted section without invoking `arch report`.
- [x] A govern tick updates `docs/METRICS.md` Trusted section.
- [x] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Decisions

- **Cycle Time excluded from lightweight path**: Lightweight refresh updates only Completed Tasks and REVIEW_FAIL Rate — both are incrementally maintainable without archive scanning. Cycle Time stays in full `arch report` until an explicit incremental index or cached aggregate exists for archive-derived timing data.
- **METRICS.md partial-update**: The lightweight refresh writes only the `### Trusted Metrics` table (two rows: Completed Tasks, REVIEW_FAIL Rate). The `### Cycle Time`, `### Experimental Metrics`, and Epistemic Digest sections are left unchanged. Implementation must surgically replace the Trusted table without touching surrounding content — not use the existing full-block replacement.
- **Both triggers always refresh**: Both task closure and govern tick unconditionally trigger the lightweight refresh. No session-level deduplication. The refresh is cheap enough that double-execution within a session is acceptable.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:** Implementation scope matches spec exactly — Completed Tasks (archive count) and REVIEW_FAIL Rate only. Cycle Time excluded per the task's Decisions section. Both mark-task-done and govern-system trigger refresh non-fatally. Dynamic import used to avoid circular dependency at module load time.

**Constraint:** LightweightMetricsRefresh uses regex replacement on raw METRICS.md content. If the Trusted Metrics table format changes (e.g. column order, row wording), the regex will fail silently and return unchanged content. The table format is stable and matches report-command.ts output.

**Cost:** Two update paths for METRICS.md (lightweight + full arch report) must maintain consistent row formatting. Divergence would cause the lightweight refresh to silently no-op. Current format is shared by inspection — not enforced by a shared constant.

**Forward Action:** If METRICS.md row format ever changes, update the regex in lightweight-metrics-refresh.ts in the same commit. No separate tracking required while the format remains stable.
