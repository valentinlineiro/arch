# IDEA: excision-legitimacy-check
**Created:** 2026-05-12
**Source:** Post-INTENT removal observation — EscalationMaturity false positive on legitimate excision
**Status:** DRAFT
**Sessions:** 0
**Meta:** P1 | S | local | cli/src/main/ts/application/use-cases/drift-checker.ts

## Problem
EscalationMaturity currently evaluates commits that touch protected domain paths (models, repositories) with a single binary question: "is there a new ADR?" This produces additive legitimacy bias — the check can validate architectural additions but has no vocabulary for intentional subtraction. A deletion of a dead artifact with a complete decision record fails the same check as an undocumented breaking change. The system cannot distinguish them.

This is not a cosmetic problem. ARCH depends on the ability to remove ontology that has outlived its design rationale. If the audit layer structurally discourages removal, it produces selection pressure toward accumulation.

## Proposed solution
Add an `ExcisionLegitimacy` check to DriftChecker. When a commit deletes one or more files from a protected domain path, evaluate a three-gate legitimacy test instead of requiring an ADR:

**Gate 1 — Reference-clean**
`grep -r <deleted-module-name> cli/src/ docs/ --include="*.ts" --include="*.md"` returns zero results outside `docs/refinement/archive/` and `docs/superpowers/`. If orphan references remain in operational code or active docs, the excision is incomplete.

**Gate 2 — Decision-backed**
The commit chain that introduced the deletion includes a commit message containing at least one of: `REJECT`, `archive`, `remove`, `excision`, `superseded`, `[THINK]`. This verifies that the removal was deliberate, not accidental.

**Gate 3 — Build-clean**
The CLI builds without errors after the deletion. Dead imports fail the build; surviving build confirms no hidden coupling.

**Result logic:**
- All 3 gates pass → `ExcisionLegitimacy: PASS` (no ADR required)
- Any gate fails → `ExcisionLegitimacy: FAIL` (requires ADR or explicit override)
- Gate 2 inconclusive (cannot read commit history) → `ExcisionLegitimacy: WARN` (flag for manual review, do not block)

**EscalationMaturity new logic:**
```
protected path modified → requires ADR
protected path deleted → run ExcisionLegitimacy gate
  PASS → no ADR required
  FAIL → requires ADR
  WARN → ⚠ flag, do not fail
```

## Why this is deterministic
Each gate produces YES/NO without narrative interpretation:
- Gate 1: grep exit code
- Gate 2: git log string match
- Gate 3: build exit code

"Net friction reduction" is excluded from the gate — it is inherently interpretive and belongs to the TENSION record, not the check. The three gates above are sufficient to distinguish negligent deletion from legitimate excision in all cases observed so far.

## Dependencies
None. DriftChecker is already reading git log (for MergeCommits, EscalationMaturity). Gate 2 reuses that infrastructure.

## Estimated size
S

## Gaps
- Protected path definition is currently implicit (any file matching domain model/repository patterns). The gate needs a canonical list — probably derived from `arch.config.json` or hardcoded in DriftChecker alongside the existing protected path patterns.
- Gate 2 commit message convention is informal. If commit prefixes are standardized in a future guideline, Gate 2 should reference that list.

## Decision
