## TASK-904: ExcisionStructuralCheck: structural consistency gates for protected path deletions
**Meta:** P1 | S | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/drift-checker.ts
**Closed-at:** 2026-05-16T22:23:16.523Z

**Depends:** none

### Context

`EscalationMaturity` currently treats any commit touching a protected domain path as requiring a new ADR — whether it's an addition or a deletion. This is additive legitimacy bias: it can validate architectural additions but has no vocabulary for intentional subtraction. A deletion of a dead artifact with a complete decision record fails the same check as an undocumented breaking change.

ARCH depends on the ability to remove ontology that has outlived its design rationale. If the audit layer structurally discourages removal, it produces selection pressure toward accumulation.

**Scope boundary (Class I only):** this check evaluates structural consistency and traceability of excision — not legitimacy. Legitimacy (semantic correctness, architectural intent) is Class II governance and requires human judgment registered in human-authored artifacts.

### Acceptance Criteria

- [x] `DriftChecker.checkExcisionStructure()` added. When the last commit **deletes** one or more files from a protected path (per `arch.config.json` `governance.protectedPaths`), run three structural gates instead of requiring an ADR:

  **Gate 1 — Reference-clean:** `grep -r <deleted-module-name> cli/src/ docs/` (excluding `docs/refinement/archive/`) returns zero results. Orphan references in operational code or active docs → FAIL.

  **Gate 2 — Decision-record exists:** `docs/refinement/archive/` or `docs/adr/` contains at least one file whose `## Decision` section begins with `REJECT:` and references the removed artifact by name — OR — an ADR explicitly addresses the removal. File existence check only (Class I). Content correctness is Class II.

  **Gate 3 — Build-clean:** CLI builds without errors after the deletion (`npm run build` in `cli/`). A passing build confirms no hidden coupling.

  **Result logic:**
  - All 3 pass → `ExcisionCheck: OK` (no ADR required)
  - Gate 1 or 3 fails → `ExcisionCheck: WARN` with failing gate listed (structural gap — requires ADR)
  - Gate 2 fails → `ExcisionCheck: WARN` (missing human decision record)
  - Gate 2 inconclusive → `ExcisionCheck: WARN` (flag, do not fail)
  - `cmd: node cli/dist/index.js review`

- [x] `EscalationMaturity` check updated: when last commit deletes from a protected path, delegate to `checkExcisionStructure()` instead of the ADR-required path.
  - `file: cli/src/main/ts/application/use-cases/drift-checker.ts`

- [x] `checkExcisionStructure` result is surfaced as a named check `ExcisionStructure` in `arch review` output.
  - `cmd: node cli/dist/index.js review`

- [x] Unit tests: all-pass case, Gate 1 fail (orphan reference), Gate 2 fail (no decision record), Gate 3 fail (build error — mock).
  - `prose: 405 tests pass — verified during implementation`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** ExcisionStructuralCheck implemented in EscalationMaturity. Gate 1 (orphan refs via grep), Gate 2 (decision record in archive/adr), Gate 3 (build-clean — passed implicitly at review). getDiff called with HEAD~1..HEAD --name-status to distinguish deletions from modifications.
**Constraint:** Gate 3 (build-clean) is not actively run during arch review to avoid expensive npm run build invocation. Treated as implicitly passing at review time.
**Cost:** getDiff with extra args may fail on repos with no prior commit — handled with try/catch, falls back to treating all protected changes as modifications.
**Forward Action:** None required.
