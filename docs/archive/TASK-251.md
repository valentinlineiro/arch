## TASK-251: Narrow official metrics output to trusted subset
**Meta:** P2 | XS | DONE | Focus:no | 2-code-generation | claude | docs/METRICS.md, cli/src/main/ts/application/use-cases/
**Closed-at:** 2026-05-15T00:00:00Z

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Restructured `formatReport` and console output to split metrics into Trusted and Experimental sections. No engine logic changed — only output presentation. METRICS.md updated to reflect the new structure with current values.

**Constraint:**
The prior format mixed calibrated and uncalibrated metrics in a single table, which implied equal confidence across all rows. The distinction was not documented anywhere in the output.

**Cost:**
No debt introduced. The next `arch report` run will regenerate METRICS.md in the new format automatically.

**Forward Action:**
Monitor that the Experimental section header is preserved across `arch report` runs. If format diverges from lightweight refresh rows, update the regex in `lightweight-metrics-refresh.ts` in the same commit.
