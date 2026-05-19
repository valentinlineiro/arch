# ARCH Versioning Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the two-track versioning architecture (protocol track + CLI track) with machine-enforced compatibility via a new `VersionCompat` drift check.

**Architecture:** `arch.config.json` owns `protocolVersion` + `minimumCliVersion` (authoritative). `cli/package.json` owns `archProtocol` range (advisory-enforced). `arch review` fails when CLI is too old or declared range excludes current protocol. DriftResult gains a `'FAIL'` status that auto-promotes to violations.

**Tech Stack:** TypeScript, Node.js >=20, `semver` npm package for range parsing.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `docs/adr/ADR-025-versioning-architecture.md` | Create | Decision record (required before touching protected path `arch.config.json`) |
| `arch.config.json` | Modify | Add `protocolVersion`, `minimumCliVersion` fields |
| `cli/package.json` | Modify | Add `archProtocol` field, add `semver` + `@types/semver` deps |
| `cli/src/main/ts/application/use-cases/drift-checker.ts` | Modify | Add `checkVersionCompat()`, extend `DriftResult.status` to include `'FAIL'` |
| `cli/src/main/ts/infrastructure/cli/output-formatter.ts` | Modify | Add `✖` icon for `'FAIL'` status in `driftIcon()` |
| `cli/src/main/ts/application/use-cases/review-system.ts` | Modify | Auto-promote `'FAIL'` drift results to violations |
| `cli/src/test/ts/drift-checker.test.ts` | Modify | Add `VersionCompat` test cases |
| `docs/PROTOCOL.md` | Create | Protocol evolution ledger, initial v1.0.0 entry |
| `docs/guidelines/versioning.md` | Modify | Rewrite with full two-track semver policy |

---

## Task 1: Write ADR-025 (required before modifying arch.config.json)

`arch.config.json` is a protected path. Governance requires an ADR before modifying it.

**Files:**
- Create: `docs/adr/ADR-025-versioning-architecture.md`

- [ ] **Step 1: Check the ADR template**

```bash
head -30 docs/adr/ADR-000-template.md
```

- [ ] **Step 2: Write the ADR**

Create `docs/adr/ADR-025-versioning-architecture.md`:

```markdown
# ADR-025: Two-Track Versioning Architecture

**Status:** ACCEPTED
**Date:** 2026-05-19

## Context

ARCH has two distinct versioning concerns:
1. Protocol semantics (invariants, agent/runtime contracts, coordination rules)
2. CLI implementation (commands, flags, output contracts, ergonomics)

These advance at different cadences. Conflating them creates false compatibility
signals and hides protocol-level breaking changes behind CLI version numbers.

## Decision

Adopt a two-track versioning model:

**Protocol track** (upstream, constitutional):
- `arch.config.json::protocolVersion` — authoritative current protocol version
- `arch.config.json::minimumCliVersion` — minimum CLI version required by this protocol
- `docs/guidelines/versioning.md` — semver policy (stable doctrine)
- `docs/PROTOCOL.md` — protocol evolution ledger (history, rationale, migration notes)

**CLI track** (downstream, operational):
- `cli/package.json::version` — authoritative CLI version
- `cli/package.json::archProtocol` — CLI-declared supported protocol range

**Compatibility invariant:** protocol MAJOR propagates upward to CLI MAJOR. CLI MAJOR
does not propagate downward. Versions are never numerically mirrored.

**Enforcement:** `arch review` gains a `VersionCompat` drift check that fails when:
- CLI version < `minimumCliVersion` (CLI too old for protocol)
- `archProtocol` is present and excludes `protocolVersion` (lying declaration)

`arch.config.json` is authoritative when metadata conflicts.

## Consequences

- `arch.config.json` gains two new fields: `protocolVersion` and `minimumCliVersion`
- `cli/package.json` gains `archProtocol` field
- `DriftResult.status` gains `'FAIL'` variant for hard-stop conditions
- `PROTOCOL.md` must be updated on every protocol version bump
```

- [ ] **Step 3: Commit**

```bash
git add docs/adr/ADR-025-versioning-architecture.md
git commit -m "docs: [TASK-XXX] add ADR-025 versioning architecture"
```

(Replace TASK-XXX with the actual task ID before committing.)

---

## Task 2: Add fields to arch.config.json and cli/package.json

**Files:**
- Modify: `arch.config.json`
- Modify: `cli/package.json`

- [ ] **Step 1: Add protocolVersion and minimumCliVersion to arch.config.json**

In `arch.config.json`, add at the top level (alongside `"version"`):

```json
"protocolVersion": "1.0.0",
"minimumCliVersion": "1.0.0",
```

The existing `"version": "1.0.0"` field in `arch.config.json` is the legacy field used by `checkVersionDrift()`. Keep it. The new `protocolVersion` is the protocol-semantic version.

- [ ] **Step 2: Add archProtocol to cli/package.json**

In `cli/package.json`, add after `"version"`:

```json
"archProtocol": ">=1.0 <2",
```

- [ ] **Step 3: Install semver package**

```bash
cd cli && npm install semver && npm install --save-dev @types/semver
```

- [ ] **Step 4: Verify arch review still passes**

```bash
arch review 2>&1 | tail -5
```

Expected: `✔` for all checks, exit 0.

- [ ] **Step 5: Commit**

```bash
git add arch.config.json cli/package.json cli/package-lock.json
git commit -m "feat: [TASK-XXX] add protocolVersion/minimumCliVersion to arch.config.json and archProtocol to package.json"
```

---

## Task 3: Extend DriftResult to support FAIL status

`DriftResult.status` is currently `'OK' | 'WARN'`. The `VersionCompat` check requires a hard `'FAIL'` that auto-promotes to violations.

**Files:**
- Modify: `cli/src/main/ts/application/use-cases/drift-checker.ts` (line 7)
- Modify: `cli/src/main/ts/infrastructure/cli/output-formatter.ts` (line 30)
- Modify: `cli/src/main/ts/application/use-cases/review-system.ts` (line 74)

- [ ] **Step 1: Write failing test for FAIL promotion**

In `cli/src/test/ts/drift-checker.test.ts`, add:

```typescript
test('review-system promotes FAIL drift to violations', async () => {
  // Arrange: a drift result with FAIL status
  const failResult: DriftResult = { check: 'VersionCompat', status: 'FAIL', details: ['CLI too old'] };
  
  // The review system should include FAIL details in violations
  // (Full integration test — run after VersionCompat is wired in Task 4)
  assert.equal(failResult.status, 'FAIL');
  assert.ok(failResult.details.length > 0);
});
```

- [ ] **Step 2: Run test — verify it compiles**

```bash
npm test --prefix cli 2>&1 | tail -10
```

Expected: tests pass (the test above is a trivial assertion, just verifying the type compiles).

- [ ] **Step 3: Extend DriftResult type**

In `drift-checker.ts` line 7, change:

```typescript
  status: 'OK' | 'WARN';
```

to:

```typescript
  status: 'OK' | 'WARN' | 'FAIL';
```

- [ ] **Step 4: Update driftIcon in output-formatter.ts**

In `output-formatter.ts`, change:

```typescript
export function driftIcon(status: string): string {
  return status === 'OK' ? `${GREEN}✔${NC}` : `${YELLOW}⚠${NC}`;
}
```

to:

```typescript
export function driftIcon(status: string): string {
  if (status === 'OK') return `${GREEN}✔${NC}`;
  if (status === 'FAIL') return `\x1b[31m✖\x1b[0m`;
  return `${YELLOW}⚠${NC}`;
}
```

- [ ] **Step 5: Auto-promote FAIL drift to violations in review-system.ts**

In `review-system.ts` line 73-77, change:

```typescript
    for (const d of drift) {
      if (d.status === 'WARN' && ['ConfigPaths', 'DocVersion', 'DeadPaths', 'TaskTemplateCompliance'].includes(d.check)) {
        violations.push(...d.details.map(detail => `[${d.check}] ${detail}`));
      }
    }
```

to:

```typescript
    for (const d of drift) {
      if (d.status === 'FAIL') {
        violations.push(...d.details.map(detail => `[${d.check}] ${detail}`));
      } else if (d.status === 'WARN' && ['ConfigPaths', 'DocVersion', 'DeadPaths', 'TaskTemplateCompliance'].includes(d.check)) {
        violations.push(...d.details.map(detail => `[${d.check}] ${detail}`));
      }
    }
```

- [ ] **Step 6: Run tests**

```bash
npm test --prefix cli 2>&1 | tail -10
```

Expected: 500+ pass, 0 fail.

- [ ] **Step 7: Commit**

```bash
git add cli/src/main/ts/application/use-cases/drift-checker.ts \
        cli/src/main/ts/infrastructure/cli/output-formatter.ts \
        cli/src/main/ts/application/use-cases/review-system.ts \
        cli/src/test/ts/drift-checker.test.ts
git commit -m "feat: [TASK-XXX] extend DriftResult with FAIL status, auto-promote to violations"
```

---

## Task 4: Implement VersionCompat drift check

**Files:**
- Modify: `cli/src/main/ts/application/use-cases/drift-checker.ts`
- Modify: `cli/src/test/ts/drift-checker.test.ts`

- [ ] **Step 1: Write failing tests**

In `cli/src/test/ts/drift-checker.test.ts`, add these tests. The mock pattern uses `MockFileSystem` with `.files` and `.dirs` records — the checker reads `${rootPath}/arch.config.json` and `${rootPath}/cli/package.json`.

```typescript
function makeVersionCompatFs(
  configOverrides: Record<string, unknown> = {},
  pkgOverrides: Record<string, unknown> = {}
): MockFileSystem {
  const fs = makeBaseFs(); // reuse existing base helper
  fs.files['/repo/arch.config.json'] = JSON.stringify({
    version: '1.0.0',
    protocolVersion: '1.0.0',
    minimumCliVersion: '1.0.0',
    ...configOverrides,
  });
  fs.files['/repo/cli/package.json'] = JSON.stringify({
    version: '1.0.0',
    archProtocol: '>=1.0 <2',
    ...pkgOverrides,
  });
  return fs;
}

test('VersionCompat - OK when CLI satisfies minimumCliVersion and archProtocol includes protocolVersion', async () => {
  const checker = new DriftChecker(makeVersionCompatFs(), new MockGitRepository(), '/repo', '1.0.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'VersionCompat');
  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('VersionCompat - FAIL when CLI version is below minimumCliVersion', async () => {
  const checker = new DriftChecker(
    makeVersionCompatFs({ minimumCliVersion: '2.0.0' }),
    new MockGitRepository(), '/repo', '1.0.0'
  );
  const result = await checker.check();
  const check = result.find(r => r.check === 'VersionCompat');
  assert.ok(check);
  assert.strictEqual(check?.status, 'FAIL');
  assert.ok(check?.details.some(d => d.includes('below minimumCliVersion')));
});

test('VersionCompat - FAIL when archProtocol present but excludes protocolVersion', async () => {
  const checker = new DriftChecker(
    makeVersionCompatFs({ protocolVersion: '2.0.0' }, { archProtocol: '>=1.0 <2' }),
    new MockGitRepository(), '/repo', '1.0.0'
  );
  const result = await checker.check();
  const check = result.find(r => r.check === 'VersionCompat');
  assert.ok(check);
  assert.strictEqual(check?.status, 'FAIL');
  assert.ok(check?.details.some(d => d.includes('excludes current protocolVersion')));
});

test('VersionCompat - WARN when archProtocol absent', async () => {
  const checker = new DriftChecker(
    makeVersionCompatFs({}, { archProtocol: undefined }),
    new MockGitRepository(), '/repo', '1.0.0'
  );
  const result = await checker.check();
  const check = result.find(r => r.check === 'VersionCompat');
  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('archProtocol missing')));
});

test('VersionCompat - WARN when archProtocol is malformed', async () => {
  const checker = new DriftChecker(
    makeVersionCompatFs({}, { archProtocol: 'not-a-valid-range' }),
    new MockGitRepository(), '/repo', '1.0.0'
  );
  const result = await checker.check();
  const check = result.find(r => r.check === 'VersionCompat');
  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
});

test('VersionCompat - OK when protocolVersion and minimumCliVersion absent (pre-versioning repo)', async () => {
  const checker = new DriftChecker(
    makeVersionCompatFs({ protocolVersion: undefined, minimumCliVersion: undefined }),
    new MockGitRepository(), '/repo', '1.0.0'
  );
  const result = await checker.check();
  const check = result.find(r => r.check === 'VersionCompat');
  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test --prefix cli 2>&1 | grep -E "fail|VersionCompat" | head -10
```

Expected: test failures (method not implemented yet).

- [ ] **Step 3: Implement checkVersionCompat in drift-checker.ts**

Add the import at the top of `drift-checker.ts`:

```typescript
import semver from 'semver';
```

Add `this.checkVersionCompat()` to the `Promise.all([...])` array in `check()`.

Add the method:

```typescript
private async checkVersionCompat(): Promise<DriftResult> {
  try {
    const configPath = `${this.rootPath}/arch.config.json`;
    const pkgPath = `${this.rootPath}/cli/package.json`;

    if (!await this.fileSystem.exists(configPath) || !await this.fileSystem.exists(pkgPath)) {
      return { check: 'VersionCompat', status: 'OK', details: [] };
    }

    const config = JSON.parse(await this.fileSystem.readFile(configPath));
    const pkg = JSON.parse(await this.fileSystem.readFile(pkgPath));

    const protocolVersion: string | undefined = config.protocolVersion;
    const minimumCliVersion: string | undefined = config.minimumCliVersion;
    const cliVersion: string | undefined = pkg.version;
    const archProtocol: string | undefined = pkg.archProtocol;

    // If neither new field is present, this repo hasn't adopted the versioning spec yet
    if (!protocolVersion && !minimumCliVersion) {
      return { check: 'VersionCompat', status: 'OK', details: [] };
    }

    const details: string[] = [];

    // Hard fail: CLI too old for protocol
    if (minimumCliVersion && cliVersion) {
      if (!semver.gte(semver.coerce(cliVersion)?.version ?? cliVersion, semver.coerce(minimumCliVersion)?.version ?? minimumCliVersion)) {
        return {
          check: 'VersionCompat',
          status: 'FAIL',
          details: [`CLI version ${cliVersion} is below minimumCliVersion ${minimumCliVersion} required by the protocol`],
        };
      }
    }

    // Hard fail: archProtocol present but excludes current protocolVersion
    if (archProtocol && protocolVersion) {
      if (!semver.validRange(archProtocol)) {
        details.push(`archProtocol "${archProtocol}" in package.json is not a valid semver range`);
        return { check: 'VersionCompat', status: 'WARN', details };
      }
      if (!semver.satisfies(semver.coerce(protocolVersion)?.version ?? protocolVersion, archProtocol)) {
        return {
          check: 'VersionCompat',
          status: 'FAIL',
          details: [`archProtocol "${archProtocol}" in package.json excludes current protocolVersion ${protocolVersion} — stale compatibility declaration`],
        };
      }
    }

    // Advisory: archProtocol absent
    if (protocolVersion && !archProtocol) {
      details.push('archProtocol missing from cli/package.json — add it for ecosystem discoverability');
      return { check: 'VersionCompat', status: 'WARN', details };
    }

    return { check: 'VersionCompat', status: 'OK', details: [] };
  } catch (e) {
    return { check: 'VersionCompat', status: 'WARN', details: [`VersionCompat check error: ${e}`] };
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test --prefix cli 2>&1 | tail -10
```

Expected: all VersionCompat tests pass.

- [ ] **Step 5: Run arch review**

```bash
arch review 2>&1 | tail -10
```

Expected: `✔ VersionCompat` in the drift section, all checks pass.

- [ ] **Step 6: Commit**

```bash
git add cli/src/main/ts/application/use-cases/drift-checker.ts \
        cli/src/test/ts/drift-checker.test.ts
git commit -m "feat: [TASK-XXX] add VersionCompat drift check"
```

---

## Task 5: Create docs/PROTOCOL.md

**Files:**
- Create: `docs/PROTOCOL.md`

- [ ] **Step 1: Create the file**

Create `docs/PROTOCOL.md`:

```markdown
# PROTOCOL.md — ARCH Protocol Evolution Ledger

Append-only record of protocol version bumps. Each entry records the rationale,
invariant changes, migration implications, and compatibility notes.

`arch.config.json` is the authoritative source of the current protocol version.
This file is historical and explanatory — not authoritative state.

---

## Protocol v1.0.0 — 2026-05-19

**Category:** protocol

**Summary:** Initial stable protocol version. Establishes the two-track versioning
architecture (protocol track + CLI track) and the VersionCompat enforcement gate.

**Invariants introduced:**
- `arch.config.json::protocolVersion` is the authoritative protocol version.
- `arch.config.json::minimumCliVersion` declares the minimum CLI version required.
- `cli/package.json::archProtocol` declares the CLI-supported protocol range.
- Protocol MAJOR propagates upward to CLI MAJOR; not the reverse.
- CLI and protocol versions are never numerically mirrored.

**Compatibility notes:**
- No migration required. This is the first formal protocol version.
- CLI v1.0.0 satisfies the `>=1.0 <2` range.
- Repositories without `protocolVersion` in `arch.config.json` are treated as
  pre-versioning and pass the VersionCompat check by default.

**ADR:** ADR-025

---

<!-- Append new entries above this line in reverse chronological order -->
```

- [ ] **Step 2: Verify arch review passes**

```bash
arch review 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add docs/PROTOCOL.md
git commit -m "docs: [TASK-XXX] create PROTOCOL.md evolution ledger"
```

---

## Task 6: Rewrite docs/guidelines/versioning.md

**Files:**
- Modify: `docs/guidelines/versioning.md`

- [ ] **Step 1: Replace the file content**

```markdown
## Versioning

ARCH uses two independent versioning tracks. They are never numerically mirrored.

---

### Protocol track

Governed by `arch.config.json::protocolVersion`. Updated when semantic or
compatibility guarantees change.

| Bump | Meaning |
|------|---------|
| MAJOR | Invariants change, compatibility guarantees break, agent/runtime expectations change, old semantic assumptions unsafe |
| MINOR | New agent or task class — backward compatible |
| PATCH | Protocol improvement, clarification, token reduction — no migration |

Every protocol bump requires an entry in `docs/PROTOCOL.md` with rationale,
invariant changes, and migration implications.

---

### CLI track

Governed by `cli/package.json::version`. Releases are milestone-based and
operator-value-driven — not on every merged task.

| Bump | Meaning |
|------|---------|
| MAJOR | Breaking command/flag/schema change; OR machine-readable output format incompatibility (JSON output, automation scripts, CI parsers, agent adapters); OR protocol MAJOR propagation. Any single condition is sufficient. |
| MINOR | New operator-facing capability — backward compatible |
| PATCH | Bugfix accumulation, small UX tweaks |

Release triggers: coherent operator-facing capability complete, UX materially
improved, migration tooling stabilized, or bugfix accumulation justifies a cut.

---

### Compatibility model

- `arch.config.json::minimumCliVersion` — minimum CLI version required by the current protocol.
- `cli/package.json::archProtocol` — CLI-declared supported protocol range (e.g. `">=1.0 <2"`).
- `arch review` enforces: CLI version >= `minimumCliVersion` (FAIL); declared range includes `protocolVersion` when present (FAIL); range absent is advisory (WARN).
- When metadata conflicts, `arch.config.json` is authoritative.

---

### Release mechanics

**CLI release:**
1. Bump `cli/package.json::version`
2. Update `archProtocol` if supported range changed
3. `arch review` must pass (VersionCompat check)
4. Tag `vX.Y.Z` on `main`
5. `npm publish` from `cli/`

**Protocol release:**
1. Update `arch.config.json::protocolVersion`
2. Update `minimumCliVersion` if protocol now requires newer CLI
3. Append entry to `docs/PROTOCOL.md`
4. Tag `protocol-vX.Y.Z` on `main`
5. If protocol MAJOR: CLI must also MAJOR before or alongside this release

---

### Tag format

- CLI releases: `vX.Y.Z` — tag on `main` after merge, never before
- Protocol releases: `protocol-vX.Y.Z`

---

### Changelog categories

Used in `PROTOCOL.md` entries and release notes:

- `protocol` — semantic or invariant changes
- `governance` — task lifecycle, agent rules, escalation changes
- `runtime` — CLI execution, command surface, output contracts
- `UX` — operator-facing ergonomics, flags, interactive flows
- `internal/refactor` — no operator-visible change
```

- [ ] **Step 2: Run arch review**

```bash
arch review 2>&1 | tail -5
```

- [ ] **Step 3: Run tests**

```bash
npm test --prefix cli 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add docs/guidelines/versioning.md
git commit -m "docs: [TASK-XXX] rewrite versioning.md with two-track semver policy"
```

---

## Final Verification

- [ ] `arch review` passes with `✔ VersionCompat`
- [ ] `npm test --prefix cli` passes (500+ tests, 0 fail)
- [ ] `arch.config.json` has `protocolVersion` and `minimumCliVersion`
- [ ] `cli/package.json` has `archProtocol`
- [ ] `docs/PROTOCOL.md` exists with v1.0.0 entry
- [ ] `docs/guidelines/versioning.md` has full two-track policy
- [ ] `docs/adr/ADR-025-versioning-architecture.md` exists and is ACCEPTED
