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

Merging to `main` with a version bump commit triggers a fully automated release:
- GitHub Actions builds, tests, and publishes to npm
- A GitHub Release is created with a changelog derived from commit messages since the last tag
- `arch.config.json` version is updated atomically with the npm publish
- Consumers running `arch upgrade` get the new version

Secondary: a `arch release` or `arch version bump` command (or npm script) makes the version bump a one-step operation locally, producing the correctly-formatted commit that the CI pipeline recognises as a release trigger.

## Proposed solution

**Phase 1 — Publish pipeline (GitHub Actions)**

New workflow `.github/workflows/release.yml`:
- Trigger: push to `main` where `cli/package.json` version differs from the latest npm tag
- Jobs: build → test → `npm publish --access public` → `gh release create vX.Y.Z`
- Requires `NPM_TOKEN` secret in the repo
- Changelog: `git log` between current and previous tag, filtered to `feat:/fix:` prefixes

**Phase 2 — Version bump tooling**

`arch version bump [patch|minor|major]` (or npm script):
- Updates `cli/package.json` version
- Updates `version` field in `arch.config.json`
- Produces a commit `chore: bump version to X.Y.Z`
- This commit is the release trigger CI looks for

**Phase 3 — Consumer upgrade (depends on TASK-1055)**

`arch upgrade` checks the latest published npm version, compares to installed, and runs `npm install -g @valentinlineiro/arch@latest` if behind. Requires TASK-1055 to be implemented first.

## Validation hints

- `.github/workflows/release.yml` exists and triggers on main push with version change
- `npm view @valentinlineiro/arch version` reflects the latest published version after a release
- `arch version bump patch` produces a correctly-formed version bump commit
- `arch upgrade` successfully upgrades an outdated install

## Dependencies

- TASK-1055 (`arch upgrade` command) — consumer upgrade path
- TASK-1056 (`arch upgrade --protocol`) — protocol artifact sync on upgrade
- Requires `NPM_TOKEN` secret configured in GitHub repo settings

## Gaps

## Decision
