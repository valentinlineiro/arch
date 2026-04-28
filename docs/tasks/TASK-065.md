## TASK-065: Prevent unintended package-lock.json churn in cli/
**Meta:** P3 | XS | IN_PROGRESS | Focus:yes | 7-operations | local | cli/.npmrc, cli/package-lock.json, docs/guidelines/
**Locked-by:** gemini | **Locked-at:** 2026-04-28T09:00:00Z

### Acceptance Criteria
- [ ] Add `save-exact=true` to `cli/.npmrc` to pin exact versions on install
- [ ] Document in `docs/guidelines/core.md` that `npm install` in `cli/` should only be run when intentionally adding or upgrading dependencies

### Definition of Done
- [ ] `cli/.npmrc` committed and effective
- [ ] Guideline entry added
