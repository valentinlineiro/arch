# IDEA-prevent-npm-install-side-effects
**Created:** 2026-04-27
**Source:** Kaizen 2026-04-27
**Status:** PROMOTED -> TASK-065
**Meta:** P3 | XS | 7-operations | cli/.npmrc, cli/package-lock.json, docs/guidelines/

### Observation
Running `npm install` in `cli/` auto-updated `package-lock.json` version. This wasn't caught until after several commits. The change is benign but creates noise.

### Proposal
Add `npm install --prefer-offline` or document that `npm install` in `cli/` should not be run casually. Consider adding a `.npmrc` with `save-exact=true` or a pre-commit check that warns on unexpected lock file changes.

### Constraint
Minimal. Low priority since the impact is cosmetic.