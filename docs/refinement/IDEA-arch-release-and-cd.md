# IDEA: ARCH release system — automated versioning, publish pipeline, and consumer upgrades
**Created:** 2026-05-27
**Source:** human intent — "achieve CD"; ARCH is published to npm but releases are fully manual today
**Status:** DRAFT
**Candidate-class:** 2-code-generation
**Candidate-size:** M

## Problem

ARCH has no continuous delivery pipeline. Publishing a new version requires a human to:
1. Manually bump `cli/package.json` version
2. Run `npm run build` locally
3. Run `npm publish` manually
4. Update `arch.config.json` version field by hand
5. Commit the version bump separately

There is no automated trigger, no release gate, no changelog, and no way for consumers to know a new version is available without manually checking npm. The `arch upgrade` and `arch upgrade --protocol` commands (TASK-1055, TASK-1056) address the consumer side, but without a CD pipeline they have nothing reliable to upgrade to.

The risk: releases happen infrequently, ship multiple unrelated changes bundled together, and have no audit trail tying commits to published artifacts.

## Proposed outcome

Sprint close automatically creates a git tag (`vX.Y.Z`), which triggers a GitHub Actions release workflow that builds, tests, publishes to npm, and creates a GitHub Release with a changelog. Consumers running `arch upgrade` get the new version. No human steps required between sprint close and published artifact.

## Proposed solution

**Phase 1 — Publish pipeline (GitHub Actions)**

New workflow `.github/workflows/release.yml`:
- Trigger: `push` on tags matching `v*.*.*`
- Jobs: build → test → `npm publish --access public` → `gh release create vX.Y.Z`
- Changelog: `git log <prev-tag>..HEAD` filtered to `feat:` and `fix:` prefixes, one line per commit
- Requires `NPM_TOKEN` secret in repo settings — **this must be configured before the task starts**

**Phase 2 — Sprint-close auto-tagging (govern integration)**

`govern-system.ts` sprint-close path, when it closes a sprint and bumps `currentSprint` in `arch.config.json`:
1. Reads the current `version` from `cli/package.json`
2. Bumps patch version (e.g. `1.2.0` → `1.2.1`)
3. Writes updated version back to `cli/package.json` and `arch.config.json`
4. Runs `git tag vX.Y.Z` and `git push --tags`
5. This tag push triggers Phase 1

Version bump strategy: patch on every sprint close. Minor bump requires explicit human instruction (e.g. a field in `arch.config.json` like `nextVersionBump: minor`).

**Phase 3 — Consumer upgrade (depends on TASK-1055)**

`arch upgrade` checks npm for the latest published version, compares to installed, and runs `npm install -g @valentinlineiro/arch@latest` if behind. Requires TASK-1055.

## Validation hints

- `.github/workflows/release.yml` exists, triggers on `v*.*.*` tag push
- `govern-system.ts` sprint-close path: bumps version in `cli/package.json` + `arch.config.json`, creates and pushes tag
- After sprint close + CI run: `npm view @valentinlineiro/arch version` reflects the new version
- `arch upgrade` successfully upgrades an outdated install (via TASK-1055)

## Dependencies

- `NPM_TOKEN` secret must be configured in GitHub repo settings **before this task can start**
- TASK-1055 (`arch upgrade` command) — consumer upgrade path (Phase 3 only; Phases 1+2 are independent)
- TASK-1056 (`arch upgrade --protocol`) — protocol artifact sync on upgrade

## Gaps

## Decision
PROMOTE → TASK-1062
