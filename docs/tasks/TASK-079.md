## TASK-079: Fix critical build and test environment failure
**Meta:** P0 | S | READY | Focus:yes | 7-operations | cli | cli/
**Depends:** none

### Acceptance Criteria
- [ ] Root cause of `npm` `ENOENT` / `ERR_MODULE_NOT_FOUND` errors in `cli/` is identified.
- [ ] A fix is implemented that allows `npm install` to run successfully within the `cli/` directory.
- [ ] `npm run build` completes successfully within the `cli/` directory.
- [ ] `npm test` runs and passes all tests successfully within the `cli/` directory.

### Definition of Done
- [ ] The CLI development environment is fully functional.
- [ ] `arch review` passes.
