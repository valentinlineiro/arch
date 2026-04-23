# ADR-001: Use git as the primary state engine

**Date:** 2026-04-23
**Status:** ACCEPTED
**Deciders:** ARCH Maintainers

---

## Context
Autonomous agent frameworks often struggle with state synchronization, auditability, and collaboration between human and non-human actors. Traditional databases introduce overhead and proprietary lock-in.

## Decision
We will use Git and the filesystem as the "operating system" and primary state engine for ARCH. Every task transition, architectural change, and agent protocol update must be committed to the repository.

## Rationale
- **Auditability:** Native `git log` provides an immutable, cryptographically signed history of all agent actions.
- **Anti-collision:** Git's merge mechanisms prevent agents from overwriting each other's work blindly.
- **Universality:** Works on every developer machine, integrates with existing CI/CD, and requires no external infrastructure.

**Alternatives considered:**
- **SaaS DB (e.g., Notion, Airtable):** High latency, requires API keys, and creates vendor lock-in.
- **Local Database (e.g., SQLite):** Opaque binary format makes code-level diffing and PR reviews difficult.
- **Flat files without Git:** Lacks the atomicity and historical tracking required for multi-agent coordination.

## Consequences
**Positive:**
- Complete transparency of system evolution via standard PR workflows.
- Native support for "Time Travel" (reverting to known good states).
- ZERO infrastructure cost.

**Negative / trade-offs:**
- **No real-time sync:** State updates are limited by commit/push/pull cycles (typically seconds, not milliseconds).
- **Merge conflicts as a feature:** If two agents touch the same task, Git forces a manual or automated resolution instead of "last write wins."
- **History Bloat:** High-frequency operations will lead to large repository sizes over time.

---
<!-- Once ACCEPTED, this ADR is permanent. -->
<!-- To reverse: create a new ADR that supersedes this one. -->
