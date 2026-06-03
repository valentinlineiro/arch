# ADR-025: Two-Track Versioning Architecture

**Date:** 2026-05-19
**Status:** ACCEPTED
**Deciders:** Valentín Liñeiro

---

## Context

ARCH has two distinct versioning concerns: protocol semantics (invariants, agent/runtime contracts, coordination rules) and CLI implementation (commands, flags, output contracts, ergonomics). These advance at different cadences. Conflating them creates false compatibility signals and hides protocol-level breaking changes behind CLI version numbers.

## Decision

Adopt a two-track versioning model with bidirectional compatibility enforcement:

- `arch.config.json` gains `protocolVersion` (authoritative protocol version) and `minimumCliVersion` (minimum CLI version required by this protocol).
- `cli/package.json` gains `archProtocol` (CLI-declared supported protocol range, e.g. `">=1.0 <2"`).
- `arch review` gains a `VersionCompat` drift check that hard-fails when CLI version < `minimumCliVersion`, or when `archProtocol` is present but excludes the current `protocolVersion`.
- `DriftResult.status` is extended to support `'FAIL'` for hard-stop conditions. All `FAIL` drift results are auto-promoted to violations.
- `docs/PROTOCOL.md` is created as the protocol evolution ledger (history, rationale, migration notes).
- `docs/guidelines/versioning.md` is rewritten with the full two-track semver policy.

## Rationale

Protocol MAJOR propagates upward to CLI MAJOR; CLI MAJOR does not propagate downward. Versions are never numerically mirrored. `arch.config.json` is authoritative when metadata conflicts. The `archProtocol` field in `package.json` is advisory-enforced: omitting it is tolerated (WARN), but a present field that lies is a hard failure.
