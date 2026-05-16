## TASK-904: ExcisionStructuralCheck: structural consistency gates for protected path deletions
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts

**Depends:** none

### Context

`EscalationMaturity` currently treats any commit touching a protected domain path as requiring a new ADR — whether it's an addition or a deletion. This is additive legitimacy bias: it can validate architectural additions but has no vocabulary for intentional subtraction. A deletion of a dead artifact with a complete decision record fails the same check as an undocumented breaking change.

ARCH depends on the ability to remove ontology that has outlived its design rationale. If the audit layer structurally discourages removal, it produces selection pressure toward accumulation.

**Scope boundary (Class I only):** this check evaluates structural consistency and traceability of excision — not legitimacy. Legitimacy (semantic correctness, architectural intent) is Class II governance and requires human judgment registered in human-authored artifacts.

### Acceptance Criteria

- [ ] `DriftChecker.checkExcisionStructure()` added. When the last commit **deletes** one or more files from a protected path (per `arch.config.json` `governance.protectedPaths`), run three structural gates instead of requiring an ADR:

  **Gate 1 — Reference-clean:** `grep -r <deleted-module-name> cli/src/ docs/` (excluding `docs/refinement/archive/`) returns zero results. Orphan references in operational code or active docs → FAIL.

  **Gate 2 — Decision-record exists:** `docs/refinement/archive/` or `docs/adr/` contains at least one file whose `## Decision` section begins with `REJECT:` and references the removed artifact by name — OR — an ADR explicitly addresses the removal. File existence check only (Class I). Content correctness is Class II.

  **Gate 3 — Build-clean:** CLI builds without errors after the deletion (`npm run build` in `cli/`). A passing build confirms no hidden coupling.

  **Result logic:**
  - All 3 pass → `ExcisionCheck: OK` (no ADR required)
  - Gate 1 or 3 fails → `ExcisionCheck: WARN` with failing gate listed (structural gap — requires ADR)
  - Gate 2 fails → `ExcisionCheck: WARN` (missing human decision record)
  - Gate 2 inconclusive → `ExcisionCheck: WARN` (flag, do not fail)
  - `cmd: node cli/dist/index.js review`

- [ ] `EscalationMaturity` check updated: when last commit deletes from a protected path, delegate to `checkExcisionStructure()` instead of the ADR-required path.
  - `file: cli/src/main/ts/application/use-cases/drift-checker.ts`

- [ ] `checkExcisionStructure` result is surfaced as a named check `ExcisionStructure` in `arch review` output.
  - `cmd: node cli/dist/index.js review`

- [ ] Unit tests: all-pass case, Gate 1 fail (orphan reference), Gate 2 fail (no decision record), Gate 3 fail (build error — mock).
  - `cmd: npm test`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
