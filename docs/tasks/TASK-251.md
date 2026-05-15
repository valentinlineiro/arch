## TASK-251: Narrow official metrics output to trusted subset
**Meta:** P2 | XS | REVIEW | Focus:no | 2-code-generation | claude | docs/METRICS.md, cli/src/main/ts/application/use-cases/

### Context

`docs/METRICS.md` currently reports "Integrity Level: LOW" at 0% confidence alongside a broad metrics surface. Metrics without confidence add noise — they imply signal that doesn't exist yet.

Three metrics are currently trustworthy (computed from committed task history, no calibration required):
- Completed tasks (raw count)
- Review fail rate (arch review violations per task closed)
- Cycle time by size (elapsed time from IN_PROGRESS to DONE, grouped by XS/S/M/L)

All other metrics (causal graph density, epistemic integrity score, confidence levels) remain in the output but are marked `[EXPERIMENTAL]` with a note that confidence is insufficient for decision-making.

### Acceptance Criteria

- [x] `docs/METRICS.md` header section lists the three canonical metrics as "Trusted" with current values.  →  prose: verified by reading METRICS.md
- [x] All other metrics in `docs/METRICS.md` are marked `[EXPERIMENTAL]` and include a one-line note explaining the confidence gap.  →  prose: verified by reading METRICS.md experimental section
- [x] The metrics generation command produces the updated output format.  →  prose: verified by running metrics generation and inspecting output
- [x] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Restructured `formatReport` and console output to split metrics into Trusted and Experimental sections. No engine logic changed — only output presentation. METRICS.md updated to reflect the new structure with current values.

**Constraint:**
The prior format mixed calibrated and uncalibrated metrics in a single table, which implied equal confidence across all rows. The distinction was not documented anywhere in the output.

**Cost:**
No debt introduced. The next `arch report` run will regenerate METRICS.md in the new format automatically.
