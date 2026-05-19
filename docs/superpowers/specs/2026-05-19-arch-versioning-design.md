# ARCH Versioning Architecture
**Date:** 2026-05-19
**Status:** Approved

---

## Overview

ARCH has two independent versioning tracks: a **protocol track** (upstream, constitutional) and a **CLI track** (downstream, operational). They advance at different cadences and are never numerically mirrored. Compatibility between them is bidirectionally declared and machine-enforced.

---

## Section 1 — The Two Tracks

### Protocol track

| Artifact | Role |
|----------|------|
| `arch.config.json::protocolVersion` | Authoritative current protocol version |
| `arch.config.json::minimumCliVersion` | Minimum CLI version required by this protocol |
| `docs/guidelines/versioning.md` | Semver policy for both tracks — constitutional law. Mostly stable. |
| `docs/PROTOCOL.md` | Protocol evolution ledger — rationale per bump, invariant changes, migration implications, semantic deltas. Historical and explanatory. Never authoritative state. |

### CLI track

| Artifact | Role |
|----------|------|
| `cli/package.json::version` | Authoritative CLI version |
| `cli/package.json::archProtocol` | CLI-declared supported protocol range for tooling and ecosystem discoverability. `arch review` validates it advisory-only against `protocolVersion` to detect stale declarations. When present, must be truthful (hard fail if the declared range excludes the current protocol version). When omitted, tolerated. |

### Compatibility precedence

When compatibility metadata conflicts, `arch.config.json` is authoritative. A stale `package.json::archProtocol` never overrides the protocol config.

---

## Section 2 — Semver Criteria

### Protocol

| Bump | Meaning |
|------|---------|
| MAJOR | Invariants change, compatibility guarantees break, agent/runtime expectations change, old semantic assumptions unsafe |
| MINOR | New agent or task class, backward compatible |
| PATCH | Protocol improvement, clarification, token reduction — no migration needed |

### CLI

| Bump | Meaning |
|------|---------|
| MAJOR | Any of: breaking command/flag/schema change; machine-readable output format incompatibility (JSON output, automation scripts, CI parsers, agent adapters); protocol MAJOR propagation. Any single condition is sufficient. |
| MINOR | New operator-facing capability, backward compatible |
| PATCH | Bugfix accumulation, small UX tweaks |

**Key invariants:**
- Protocol MAJOR propagates upward to CLI MAJOR.
- CLI MAJOR does not propagate downward to protocol.
- CLI version and protocol version are never numerically mirrored.
- Machine-readable output shape is API surface. Breaking it requires a CLI MAJOR regardless of whether commands still execute.

### Release cadence

CLI releases are milestone-based and operator-value-driven. Triggers: a coherent operator-facing capability is complete, UX materially improved, migration tooling stabilizes, or bugfix accumulation justifies a cut. Not on every merged task.

---

## Section 3 — Compatibility Enforcement

`arch review` gains a `VersionCompat` drift check with the following logic:

| Condition | Severity |
|-----------|----------|
| `package.json::version` < `arch.config.json::minimumCliVersion` | **FAIL** — CLI is too old for the protocol |
| `arch.config.json::protocolVersion` not in `package.json::archProtocol` range (when field is present) | **FAIL** — CLI declared range excludes current protocol; lying is not tolerated |
| `package.json::archProtocol` absent | **WARN** — advisory; optional echo is missing |
| `package.json::archProtocol` malformed | **WARN** — advisory; metadata unparseable |

Rationale for the hard fail on range exclusion: if the field exists, it must be truthful. A stale but present compatibility declaration is worse than a missing one — it creates false confidence in downstream tooling.

---

## Section 4 — Release Mechanics

### Cutting a CLI release

1. Bump `cli/package.json::version`
2. Update `cli/package.json::archProtocol` if the supported protocol range changed
3. Run `arch review` — `VersionCompat` must pass
4. Tag `vX.Y.Z` on `main`
5. Run `npm publish` from `cli/`

### Cutting a protocol release

1. Update `arch.config.json::protocolVersion`
2. Update `arch.config.json::minimumCliVersion` if the protocol now requires a newer CLI
3. Append an entry to `docs/PROTOCOL.md` with: rationale, invariant changes, migration implications, compatibility notes
4. Tag `protocol-vX.Y.Z` on `main`
5. If protocol is MAJOR: CLI must also MAJOR before or alongside this release

### Changelog categories

Used in `PROTOCOL.md` entries and release notes:
- `protocol` — semantic or invariant changes
- `governance` — task lifecycle, agent rules, escalation changes
- `runtime` — CLI execution, command surface, output contracts
- `UX` — operator-facing ergonomics, flags, interactive flows
- `internal/refactor` — no operator-visible change

---

## Section 5 — Future Compatibility Modes (deferred)

Not implemented in v1. The architecture supports adding:

```json
"protocolCompatibilityMode": "strict" | "transitional" | "deprecated"
```

to `arch.config.json` when multi-version migration windows are needed. Deferred until migration scenarios appear.

---

## Files to Create or Modify

| File | Action |
|------|--------|
| `arch.config.json` | Add `minimumCliVersion` field |
| `cli/package.json` | Add `archProtocol` field |
| `docs/guidelines/versioning.md` | Rewrite with full two-track semver policy |
| `docs/PROTOCOL.md` | Create — initial entry for v1.0.0 |
| `cli/src/main/ts/application/use-cases/drift-checker.ts` | Add `VersionCompat` check |
