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
