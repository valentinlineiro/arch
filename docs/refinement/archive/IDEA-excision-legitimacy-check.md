# IDEA: excision-structural-consistency-check
**Created:** 2026-05-12
**Source:** Post-INTENT removal observation — EscalationMaturity false positive on legitimate excision
**Status:** PROMOTED
**Sessions:** 2
**Meta:** P1 | S | local | cli/src/main/ts/application/use-cases/drift-checker.ts

## Problem
EscalationMaturity currently evaluates commits that touch protected domain paths (models, repositories) with a single binary question: "is there a new ADR?" This produces additive legitimacy bias — the check can validate architectural additions but has no vocabulary for intentional subtraction. A deletion of a dead artifact with a complete decision record fails the same check as an undocumented breaking change. The system cannot distinguish them.

This is not a cosmetic problem. ARCH depends on the ability to remove ontology that has outlived its design rationale. If the audit layer structurally discourages removal, it produces selection pressure toward accumulation.

## Scope correction (Class I only)
This check evaluates **structural consistency and traceability** of excision — not legitimacy. Legitimacy (semantic correctness, architectural intent) is Class II governance: it requires human judgment and is registered in human-authored artifacts. This check verifies that the structural prerequisites for a legitimate excision are present — it does not evaluate whether the excision was architecturally correct. See `docs/GOVERNANCE.md §Governance Epistemological Boundary`.

## Proposed solution
Add an `ExcisionStructuralCheck` to DriftChecker. When a commit deletes one or more files from a protected domain path, evaluate a three-gate consistency test instead of requiring an ADR:

**Gate 1 — Reference-clean**
`grep -r <deleted-module-name> cli/src/ docs/ --include="*.ts" --include="*.md"` returns zero results outside `docs/refinement/archive/` and `docs/superpowers/`. Orphan references in operational code or active docs indicate incomplete removal.

**Gate 2 — Decision-record exists** *(not: "git log string match")*
`docs/refinement/archive/` contains at least one file added in recent commits whose `## Decision` section begins with `REJECT:` and whose content references the removed artifact by name — OR — an ADR in `docs/adr/` explicitly addresses the removal. This gate checks artifact existence, not artifact content. Content correctness is Class II and belongs to human review.

**Gate 3 — Build-clean**
The CLI builds without errors after the deletion. This is runtime integrity (structural consistency), not semantic correctness. A passing build confirms no hidden coupling; it does not confirm the removal was right.

**Result logic:**
- All 3 gates pass → `ExcisionCheck: PASS` (no ADR required — structural prerequisites met)
- Gate 1 or 3 fails → `ExcisionCheck: FAIL` (requires ADR — structural gaps remain)
- Gate 2 fails → `ExcisionCheck: FAIL` (requires human decision record — Class II artifact missing)
- Gate 2 inconclusive (archive unreadable) → `ExcisionCheck: WARN` (flag for manual review, do not block)

**EscalationMaturity new logic:**
```
protected path modified → requires ADR (unchanged)
protected path deleted → run ExcisionStructuralCheck
  PASS → no ADR required (Class I gates satisfied; Class II recorded separately)
  FAIL → requires ADR or human decision record
  WARN → ⚠ flag, do not fail
```

## Dependencies
None. DriftChecker is already reading git log (for MergeCommits, EscalationMaturity). Gate 2 reuses that infrastructure.

## Estimated size
S

## Gaps
- Protected path definition is currently implicit (any file matching domain model/repository patterns). The gate needs a canonical list — probably derived from `arch.config.json` or hardcoded in DriftChecker alongside the existing protected path patterns.
- Gate 2 requires linking a deleted TypeScript file to a REJECT decision in a markdown file. That link is currently informal (matching by artifact name substring). A structured cross-reference (e.g., `Removes: <module-path>` in the REJECT field) would make Gate 2 deterministic without false positives.
- The Class I/Class II boundary is stated in GOVERNANCE.md but not enforced in check naming conventions. This IDEA should be revisited if the naming convention is ever formalized.

## Structural admissibility (5-axis)

| Axis | Status | Note |
|------|--------|------|
| Dependency ordering | Satisfied | Uses existing DriftChecker / git log infra. |
| Temporal validity | Satisfied | INTENT removal case confirmed the gap. |
| Abstraction layer | Satisfied | Correct layer for structural consistency. |
| Observability validity | Satisfied | Deletions and references are grep-able. |
| Priority displacement | Satisfied | P1. |

**Structural admissibility:** satisfied.

## Decision

## Decision
PROMOTE → TASK-904
