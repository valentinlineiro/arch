## TASK-255: Split THINK into structural default loop and --deep mode
**Meta:** P1 | M | REVIEW | Focus:no | 6-writing | claude | docs/agents/THINK.md, arch.config.json, cli/src/main/ts/application/commands/reflect-command.ts, cli/src/main/ts/application/use-cases/govern-system.ts
**Depends:** TASK-254

### Context

THINK currently runs all phases in a single invocation: structural replenishment, IDEA promotion, semantic drift analysis, governance audits, and kaizen. Every `arch reflect` call pays the full analysis cost regardless of which phases are actually needed.

TASK-254 audit conclusion: the structural core is Phase 1 (full) + Phase 2 execution-only (DECIDED promotions + TTL archival). Everything else is deferrable.

The target split:

**Default `arch reflect`** (structural only):
- Phase 1: health evaluation, replenishment, INBOX regeneration
- Phase 2: DECIDED promotions (L2 autonomy execution) + TTL archival only; DRAFT evaluation skipped

**`arch reflect --deep`** (full analysis, threshold-triggered):
- All default phases plus Phase 2.5 and Phase 3
- Phase 2.5 cadence: runs when N govern ticks have elapsed since the last deep run, OR when any weak signal is at or past its adjudication date (immediate trigger)
- N defaults to 5, configurable via `arch.config.json` `reflect.deepCadenceN`

`arch govern` surfaces "deep analysis due" in its output when the cadence threshold is reached, without running the analysis itself. The human or automated loop decides when to invoke `arch reflect --deep`.

**Naming note:** TASK-250 (CLI unification) plans to move `reflect` under `arch govern reflect`. TASK-255 should not block on TASK-250 — implement against the current `arch reflect` command. The flag and cadence logic will remain correct after the rename.

### Acceptance Criteria

- [ ] `docs/agents/THINK.md` is rewritten with two clearly labelled mode sections: `## Default Mode` (Phase 1 + Phase 2 execution-only) and `## Deep Mode (--deep)` (all phases).  →  prose: verified by reading THINK.md structure
- [ ] `arch.config.json` includes `reflect.deepCadenceN` (default: 5). Existing `reflect.thresholds` block is preserved.  →  grep: "deepCadenceN" arch.config.json
- [ ] `.arch/deep-analysis-state.json` is created on first `arch reflect --deep` run, recording `lastDeepRunTick` and `lastDeepRunTimestamp`.  →  prose: verified by running arch reflect --deep and checking .arch/
- [ ] `arch reflect` (no flag) runs only the structural phases and exits without running Phase 2.5 or Phase 3.  →  prose: verified by observing reflect output — no Phase 2.5 or Kaizen output
- [ ] `arch reflect --deep` runs all phases, updates `.arch/deep-analysis-state.json` on completion.  →  prose: verified by running arch reflect --deep and checking output + state file
- [ ] `arch govern` output includes "deep analysis due (run arch reflect --deep)" when `currentTick - lastDeepRunTick >= deepCadenceN` OR when any weak signal adjudication date has passed.  →  prose: verified by reading govern output after N ticks without a deep run
- [ ] `arch reflect --deep` immediate trigger fires when any `docs/tensions/weak-signals.md` signal has an `Adjudicate by:` date ≤ today, regardless of tick count.  →  prose: verified by reading the date-check logic in reflect-command.ts
- [ ] CLI tests cover: default mode skips Phase 2.5, deep mode runs Phase 2.5, cadence gate fires at N ticks, immediate trigger fires on past-deadline signal.  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [ ] `arch reflect` with no flags produces no Phase 2.5 or Kaizen output.
- [ ] `arch reflect --deep` produces Phase 2.5 and Kaizen output and updates the state file.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Decisions

- **Cadence state location**: Store in `.arch/deep-analysis-state.json`. This is operational runtime state, not durable product knowledge — it does not belong in `docs/` or `arch.config.json`.
- **Weak signal date format**: Require ISO `YYYY-MM-DD` for all `Adjudicate by:` fields in `docs/tensions/weak-signals.md`. If existing entries use free-form dates, this task must either normalize them to ISO format or implement fail-closed skip (log a warning, do not trigger immediate run) for unparseable entries. Silent skip is not acceptable.
- **DRAFT evaluation cap in --deep**: Keep the 3-per-session cap. `--deep` adds deeper phases; it does not reopen unbounded queue consumption. The cap remains 3 DRAFTs per session regardless of mode.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
THINK.md rewrite is scoped to structural split only. Phase 3 "Immediate Improvements" removal is deferred to TASK-256 so that each commit is atomic and reviewable independently.

**Constraint:**
Combining THINK split and Kaizen evidence gate changes in one task would make the diff harder to audit and increase the risk of introducing inconsistencies across the restructured protocol.

**Cost:**
TASK-255 and TASK-256 must be sequenced — TASK-256 should not start until TASK-255 is at REVIEW or DONE, to avoid conflicting edits to THINK.md.

**Forward Action:**
Start TASK-256 only after this task is audited at DONE; monitor for Phase 3 Kaizen evidence gate compliance in subsequent THINK sessions.
