## Testing a change
Verification is required for every change based on its type.

### CLI Changes (`cli/`)
- Run `npm run build` to ensure compilation.
- Run `npm test` to verify logic integrity.
- Run `arch review` to verify system-wide drift.

### Agent Protocol Changes (`docs/agents/`)
- Apply it to at least one real project using ARCH.
- Run one full cycle (THINK → DO or REFINE → output review).
- Note the result in the PR body.

### Guideline Changes (`docs/guidelines/`)
- Run `arch review` to ensure format validity.
- Manually verify that no active task references or existing protocols are broken by the change.

### Config Changes (`arch.config.json`)
- Run `arch review` to verify schema validity.
- Manually confirm the changed field is exercised (e.g., if changing routing, run a task that uses that route).
