## TASK-072: Implement `arch --version` command
**Meta:** P3 | XS | READY | Focus:yes | 1-implementation | cli | cli/src/main/ts/index.ts
**Depends:** none

### Acceptance Criteria
- [ ] Add `version` command to CLI that prints the version from `package.json`
- [ ] Add support for `--version` and `-v` flags in the main entrypoint
- [ ] Ensure `arch review` still works correctly with the new version command
- [ ] Rebuild CLI and verify output

### Definition of Done
- [ ] `arch version`, `arch --version`, and `arch -v` all output the current version (e.g., `v0.4.0`)
- [ ] Tests pass
