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
- `arch check` enforces: CLI version >= `minimumCliVersion` (FAIL); declared range includes `protocolVersion` when present (FAIL); range absent is advisory (WARN).
- When metadata conflicts, `arch.config.json` is authoritative.

---

### Release mechanics

**CLI release:**
1. Bump `cli/package.json::version`
2. Update `archProtocol` if supported range changed
3. `arch check` must pass (VersionCompat check)
4. Tag v{major}.{minor}.{patch} on `main`
5. `npm publish` from `cli/`

**Protocol release:**
1. Update `arch.config.json::protocolVersion`
2. Update `minimumCliVersion` if protocol now requires newer CLI
3. Append entry to `docs/PROTOCOL.md`
4. Tag protocol-v{major}.{minor}.{patch} on `main`
5. If protocol MAJOR: CLI must also MAJOR before or alongside this release

---

### Tag format

- CLI releases: v{major}.{minor}.{patch} — tag on `main` after merge, never before
- Protocol releases: protocol-v{major}.{minor}.{patch}

---

### Changelog categories

Used in `docs/PROTOCOL.md` entries and release notes:

- `protocol` — semantic or invariant changes
- `governance` — task lifecycle, agent rules, escalation changes
- `runtime` — CLI execution, command surface, output contracts
- `UX` — operator-facing ergonomics, flags, interactive flows
- `internal/refactor` — no operator-visible change
