## TASK-065: Prevent unintended package-lock.json churn in cli/
**Meta:** P3 | XS | REVIEW | Focus:yes | 7-operations | local | cli/.npmrc, cli/package-lock.json, docs/guidelines/

### Acceptance Criteria
- [x] Add `save-exact=true` to `cli/.npmrc` to pin exact versions on install
- [x] Document in `docs/guidelines/core.md` that `npm install` in `cli/` should only be run when intentionally adding or upgrading dependencies

### Definition of Done
- [x] `cli/.npmrc` committed and effective
- [x] Guideline entry added
