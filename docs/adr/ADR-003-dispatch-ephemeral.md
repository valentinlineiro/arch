# ADR-003: DISPATCH output is ephemeral — exception to ADR-001

**Date:** 2026-04-24
**Status:** ACCEPTED
**Deciders:** ARCH Maintainers
**Supersedes:** none
**Related:** ADR-001 (git as primary state engine)

---

## Context

ADR-001 establishes git and the filesystem as the primary state engine for ARCH. Every task transition must be committed to the repository.

In v0.1, the CONDUCTOR agent writes its recommendations to `docs/DISPATCH.md` and commits that file. This creates a persistent, auditable record of recommendations — but also introduces friction: DISPATCH.md becomes stale the moment any task changes status, requires explicit invalidation protocols (TASK-017), and duplicates information already present in SPRINT.md and BACKLOG.md.

The question is whether DISPATCH.md carries unique state or is a derived view of state that already lives elsewhere.

## Decision

DISPATCH output will be written to terminal only, not persisted to the repository. DISPATCH.md will be eliminated in v0.2.

This is an explicit, bounded exception to ADR-001.

## Rationale

**DISPATCH is a derived view, not a source of truth.**
Every recommendation in DISPATCH is grounded in the current state of SPRINT.md and BACKLOG.md. No information exists in DISPATCH that cannot be reconstructed by re-running CONDUCTOR against those files.

**The real state already lives in versioned files.**
Task status, priority, dependencies, and sprint health are tracked in SPRINT.md and BACKLOG.md. Those files are committed on every transition. The audit trail is complete without DISPATCH.

**Persistence creates false authority.**
A committed DISPATCH.md implies the recommendations are current. They are not — they expire the moment any task moves. The invalidation overhead (TASK-017, `Last-invalidated:` field) is a symptom of this mismatch.

**Alternatives considered:**

- **Keep DISPATCH.md with strict TTL:** Adds protocol complexity (TASK-017) without solving the root problem. Rejected.
- **DISPATCH.md as an optional artifact (not committed):** Reduces friction but still requires agents to conditionally write/skip the file. Rejected in favor of a clean cut.
- **Structured terminal output (JSON/YAML):** Out of scope for v0.2. Could be revisited for CI/CD integration.

## Consequences

**Positive:**
- CONDUCTOR protocol simplifies: no commit step, no file write, no staleness management.
- Eliminates TASK-017 and related invalidation overhead.
- Reduces repo noise — recommendation history was low-signal in `git log`.

**Negative / trade-offs:**
- **Loss of recommendation auditability:** There is no persistent record of what CONDUCTOR recommended on a given day. Mitigation: recommendations are reproducible by re-running CONDUCTOR against the same git state.
- **No async handoff via file:** In v0.1, a human could read DISPATCH.md after the agent session ended. In v0.2, the human must be present during CONDUCTOR output or read the terminal log. Mitigation: terminal output can be piped or logged by the invoking shell.

## Scope of exception

This exception applies only to DISPATCH/CONDUCTOR output. All other agent actions (task status changes, ADRs, protocol updates) remain committed to git per ADR-001.

---
<!-- Once ACCEPTED, this ADR is permanent. -->
<!-- To reverse: create a new ADR that supersedes this one. -->
