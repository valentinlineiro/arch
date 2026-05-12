## TASK-229: Fix generate-inbox IDEA status filter broken by markdown bold format
**Meta:** P1 | XS | DONE | Focus:no | 9-bugfix | claude-code | cli/src/main/ts/application/use-cases/generate-inbox.ts
**Depends:** none

### Context
`arch inbox` always showed "No pending ideas" even with 36 IDEA files in `docs/refinement/`. The filter `content.includes('Status: DRAFT')` never matched because IDEA files use `**Status:** DRAFT` (markdown bold). The `**` between colon and value breaks the substring match — zero IDEAs passed the filter.

### Acceptance Criteria
- [x] `arch inbox` refinement queue shows all DRAFT IDEAs
- [x] Filter regex handles both `Status: DRAFT` and `**Status:** DRAFT` formats
