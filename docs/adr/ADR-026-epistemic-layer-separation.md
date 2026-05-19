# ADR-026: Epistemic Layer Separation — Event Log, State Projection, Governance Semantics

**Date:** 2026-05-19
**Status:** ACCEPTED
**Deciders:** Valentín Liñeiro

---

## Context

ARCH produces governance information through two distinct processes:

1. `docs/INBOX.md` — written by agents during ticks, append-only, never overwritten.
2. `arch govern inbox` — computed live from `docs/tasks/`, `.arch/escalations.jsonl`, and sprint state.

These were treated implicitly as two views of the same reality, producing recurring pressure to "synchronize" them when their counts diverge. That pressure is architecturally incoherent: the two surfaces are not replicas. They operate under different observation rules and serve different epistemological functions.

The same confusion applies to pattern alerts (written to INBOX.md by THINK, not surfaced by the live command), escalation counts, and task status summaries.

Forcing convergence would destroy the property that makes each surface useful:
- Overwriting INBOX.md loses the historical trace.
- Making the live view match the file means projecting a stale state.

There is no "global consistent truth in real time + immutable historical record" without a formal event sourcing system. ARCH does not have one, and does not need one for its current scope.

---

## Decision

ARCH's governance information is organized into three explicit layers. These layers are not equivalent and must not be treated as replicas of each other.

### Layer 1 — Event Log
**Artifact:** `docs/INBOX.md`
**Nature:** Append-only. Written by agents during govern ticks and THINK sessions. Never overwritten, never corrected retroactively.
**What it represents:** A record of what was observed and written at a point in time — not current system state.
**Correct use:** Audit trail, pattern detection across sessions, historical triage record.
**Incorrect use:** Real-time triage. Counts and task lists in this file are expected to diverge from live state over time. This is not a bug.

### Layer 2 — State Projection
**Artifact:** `arch govern inbox` (CLI command)
**Nature:** Computed on demand from authoritative sources: `docs/tasks/` (task status), `.arch/escalations.jsonl` (open escalations), `arch.config.json` (sprint state).
**What it represents:** Current operational state at the moment of invocation.
**Correct use:** Real-time triage, focus assignment, identifying actionable work.
**Incorrect use:** Historical record. The live view does not retain what was true in past sessions.

### Layer 3 — Governance Semantics
**Artifacts:** `docs/tensions/`, `docs/adr/`, `docs/refinement/`, `.arch/escalations.jsonl`
**Nature:** Interpreted structures — patterns, decisions, structural concerns — derived from observations in layers 1 and 2.
**What it represents:** The system's understanding of itself: what is broken, what was decided, what needs human judgment.
**Correct use:** Architectural decisions, tension documentation, IDEA promotion.
**Incorrect use:** Operational state. A TENSION document does not mean the problem is still active. An IDEA does not mean a task exists.

---

## Consequences

**Divergence between layers is expected and not actionable.** A count mismatch between INBOX.md and `arch govern inbox` is a structural property of the design, not a defect. Agents must not attempt to reconcile them by overwriting or patching the event log.

**Pattern alerts written to INBOX.md are not required to appear in `arch govern inbox`.** They belong to the event log layer. If a pattern alert reaches governance-semantic significance, a TENSION document is the correct escalation path — not a sync operation.

**The authoritative source for task status is `docs/tasks/`.** Neither INBOX.md nor `arch govern inbox` overrides it. `arch govern inbox` derives from it; INBOX.md records snapshots of it.

**TENSION-006 (inbox dual truth surfaces) is resolved by this ADR.** The "required correction" in that document (synchronizing the two surfaces) is architecturally incorrect. The correct resolution is this layer declaration. TENSION-006 status: frozen.

---

## Alternatives Considered

**Option B — INBOX.md regenerated on each tick:** Loses event log value. INBOX.md becomes a cache, not a record. The historical trace of THINK-session pattern alerts and escalation accumulation is destroyed.

**Option C — Formal event sourcing:** Correct in principle. Introduces projection rules, versioned projections, and mathematical reconciliation. Out of scope for ARCH's current operational complexity. Revisit if the system grows to require cross-session query over governance events.

---

## References

- TENSION-006: Dual inbox truth surfaces (`docs/tensions/TENSION-006-inbox-dual-truth.md`)
- CLAUDE.md §Invariants: "INBOX.md is human-only. Agents write to it; humans read it."
- ADR-015: Causal Signal Arbitration Layer
- ADR-017: Deterministic Observability & Operational Metrics
