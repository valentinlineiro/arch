## TASK-079: Fix critical build and test environment failure
**Meta:** P0 | S | IN_PROGRESS | Focus:yes | 7-operations | cli | cli/ | lock:cli
**Depends:** none

### NOTE: BLOCKED - REQUIRES USER INTERVENTION
This task is blocked by a fundamental issue within the user's `npm` or shell environment. **The `npm` command is consistently failing to identify the correct working directory**, causing all `npm` operations to fail with an `ENOENT` error as it incorrectly looks for `package.json` in a parent directory.

**Diagnostics Performed:**
- A clean `npm install` was attempted.
- The command was run from a completely isolated temporary directory (`/tmp/cli-test`).
- Node.js and npm versions were verified (`v24.14.1` and `11.11.0`).
- No conflicting `.npmrc` files were found.

**Conclusion:** The issue is external to the project code and its configuration. The user's `npm` installation is not functioning correctly.

**Recommendation for User:**
1.  Completely uninstall Node.js, npm, and any version managers (like `nvm`).
2.  Perform a fresh installation of `nvm`, Node.js (LTS), and `npm`.
3.  Verify the installation with `npm -v` in a new terminal session.

This task cannot be completed until the environment is repaired.

### Acceptance Criteria
- [ ] Root cause of `npm` `ENOENT` / `ERR_MODULE_NOT_FOUND` errors in `cli/` is identified.
- [ ] A fix is implemented that allows `npm install` to run successfully within the `cli/` directory.
- [ ] `npm run build` completes successfully within the `cli/` directory.
- [ ] `npm test` runs and passes all tests successfully within the `cli/` directory.

### Definition of Done
- [ ] The CLI development environment is fully functional.
- [ ] `arch review` passes.
