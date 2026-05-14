## TASK-229: Fix generate-inbox IDEA status filter broken by markdown bold format
**Meta:** P1 | XS | DONE | Focus:no | 9-bugfix | claude-code | cli/src/main/ts/application/use-cases/generate-inbox.ts
**Depends:** none

### Context
`arch inbox` always showed "No pending ideas" even with 36 IDEA files in `docs/refinement/`. The filter `content.includes('Status: DRAFT')` never matched because IDEA files use `**Status:** DRAFT` (markdown bold). The `**` between colon and value breaks the substring match — zero IDEAs passed the filter.

### Acceptance Criteria
- [x] `arch inbox` refinement queue shows all DRAFT IDEAs
- [x] Filter regex handles both `Status: DRAFT` and `**Status:** DRAFT` formats

## Hansei
**Severity:** H1
**Category:** [SpecDrift]

**Decision:**
The inbox IDEA filter used a plain substring match for `Status: DRAFT`, but IDEA files use markdown-bold format `**Status:** DRAFT`. This caused 100% of DRAFT IDEAs to be silently excluded from `arch inbox` output. Fix applied regex to handle both format variants.

**Constraint:**
No formal spec existed for the IDEA file markdown format when the filter was originally written; the mismatch was not caught by existing tests.

**Cost:**
Silent data loss in inbox output while the bug existed. No residual debt after fix; filter now handles both format variants.

**Forward Action:**
No forward action required. Filter is verified against both format variants; IDEA file format is now implicitly documented through the regex pattern.
