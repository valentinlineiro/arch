# Design: Shared Test Mock Module (TASK-243)

*Date: 2026-05-14*

## Problem

15 active test files each hand-roll their own `MockFileSystem` and `MockGitRepository`. None use `implements`, so interface drift is silent — a new method on `GitRepository` won't cause a compile error in any mock, and already `getDiff(args?)` is missing from several mock signatures.

## Approach: Canonical Shared Mock Module

Create `cli/src/test/ts/mocks/index.ts` exporting `MockFileSystem implements FileSystem` and `MockGitRepository implements GitRepository`. All active test files import from there instead of re-declaring.

**Why this approach:**
- TypeScript enforces interface completeness at compile time — drift becomes a build error, not a silent test gap
- Eliminates ~400 lines of duplicated boilerplate across 15 files
- Zero new dependencies

## Components

### `cli/src/test/ts/mocks/index.ts`

`MockFileSystem`:
- `files: Record<string, string>` — in-memory file store
- `dirs: Record<string, string[]>` — explicit directory listings
- All `FileSystem` methods operate on those maps

`MockGitRepository`:
- `commits: CommitRecord[]` — returned by `getCommitHistory()`
- `validHashes: Set<string>` — returned by `isValidCommitHash()`
- `statusLines: string[]`, `diff: string`, etc. for other methods
- All `GitRepository` methods implemented, args accepted correctly

### Integration smoke test

`cli/src/test/ts/git-cli-integration.test.ts` — spins up a temp `git init` repo using Node `os.tmpdir()`, runs a few `GitCli` operations (add, commit, log, getDiff), asserts results. Uses `skip` if git is not on PATH. One file, no mocking.

## Migration

Each of the 15 test files: remove local mock class declarations, add import from `../../mocks/index.js`, adjust property assignments to match the canonical mock's API.

## Out of Scope

- No changes to production code
- No mocking library introduced
- Archive tests (`archive/`) left as-is (already excluded from test runner)
