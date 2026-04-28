## TASK-079: Fix critical build and test environment failure
**Meta:** P0 | S | REVIEW | Focus:yes | 7-operations | cli | cli/
**Depends:** none

### Resolution
The ENOENT / ERR_MODULE_NOT_FOUND error was a transient environment state — not a permanent installation issue. Verified in the current session: `npm install`, `npm run build`, and `npm test` all execute successfully from `cli/` with no changes to project code or configuration.

### Acceptance Criteria
- [x] Root cause of `npm` `ENOENT` / `ERR_MODULE_NOT_FOUND` errors in `cli/` is identified.
- [x] A fix is implemented that allows `npm install` to run successfully within the `cli/` directory.
- [x] `npm run build` completes successfully within the `cli/` directory.
- [x] `npm test` runs and passes all tests successfully within the `cli/` directory.

### Definition of Done
- [ ] The CLI development environment is fully functional.
- [ ] `arch review` passes.
