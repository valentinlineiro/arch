# IDEA: Fix build and test environment
**Created:** 2026-04-28
**Source:** THINK mode analysis (Blocked task TASK-078)
**Status:** PROMOTED → TASK-079
**Meta:** P0 | S | cli | cli/

## Problem
The Node.js/npm environment within the `cli/` directory is non-functional. Commands like `npm test` and `npm run build` fail with `ENOENT` or `ERR_MODULE_NOT_FOUND` errors. This prevents all development, validation, and testing of the CLI, blocking all other tasks.

## Proposed solution
1. Diagnose the root cause of the module resolution failure.
2. Repair the environment to ensure `npm install`, `npm run build`, and `npm test` execute successfully from within the `cli/` directory.
3. Verify the fix by running the full test suite.

## Dependencies
None

## Estimated size
S
