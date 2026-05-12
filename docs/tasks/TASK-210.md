## TASK-210: Fix generate-inbox IDEA status filter broken by markdown bold format
**Meta:** P1 | XS | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/generate-inbox.ts
**Depends:** none

### Context
`arch inbox` always showed "No pending ideas" even with 36 IDEA files in `docs/refinement/`. The filter `content.includes('Status: DRAFT')` never matched because IDEA files use `**Status:** DRAFT` (markdown bold). The `**` between the colon and value breaks the substring match.

### Acceptance Criteria
- [x] `arch inbox` refinement queue shows all DRAFT IDEAs
- [x] Filter handles both `Status: DRAFT` and `**Status:** DRAFT` formats
