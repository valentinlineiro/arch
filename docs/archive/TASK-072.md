## TASK-072: Implement `arch --version` command
**Meta:** P3 | XS | 5 | DONE | Focus:no | 1-implementation | cli | cli/src/main/ts/index.ts
**Closed-at:** 2026-04-28T10:00:00Z
**Iterations:** 1

### Acceptance Criteria
- [x] Add `version` command to CLI that prints the version from `package.json`
- [x] Add support for `--version` and `-v` flags in the main entrypoint
- [x] Ensure `arch review` still works correctly with the new version command
- [x] Rebuild CLI and verify output

### Definition of Done
- [x] `arch version`, `arch --version`, and `arch -v` all output the current version (e.g., `v0.4.0`)
- [x] Tests pass
