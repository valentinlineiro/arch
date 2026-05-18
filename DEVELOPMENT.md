# DEVELOPMENT
<!-- ARCH Implementation-specific guidelines -->

## Dependency Hygiene
`npm install` in `cli/` should only be run when intentionally adding or upgrading dependencies to prevent unintended `package-lock.json` churn. Always verify diffs before committing lock files.

## Build Requirement
Any change to the CLI source (`cli/src/main/ts/`) must be followed by `npm run upgrade` within the `cli/` directory (`npm run build && npm link`) to update the `dist/` artifacts and relink the global `arch` binary. Failure to rebuild leads to stale behavior during verification.

## Git Hooks
To ensure commit messages comply with the protocol, install the ARCH git hooks:
```bash
./scripts/install-hooks.sh
```
This installs a `commit-msg` hook that enforces the presence of a `[TASK-XXX]` reference or a valid exemption prefix.
