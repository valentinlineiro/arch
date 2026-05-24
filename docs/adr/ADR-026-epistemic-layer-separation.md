# ADR-026: Epistemic Layer Separation — Event Log, State Projection, Governance Semantics

**Date:** 2026-05-19
**Status:** ACCEPTED
**Enforcement:** Prohibitions P1–P5 are architectural invariants. Non-compliance is not style drift — it is a semantic layer violation.
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

## Prohibitions

These are rules of impossibility, not guidelines. Violating them is not a judgment call — it is a category error.

**P1 — INBOX.md is never a source of operational state.**  
Any computation, triage decision, or agent action that depends on current system state must derive that state exclusively from Layer 2 sources (`docs/tasks/`, `.arch/escalations.jsonl`, `arch.config.json`). INBOX.md must be ignored completely for operational purposes. An agent that reads INBOX.md to decide what to do next is operating on write history, not system state — the result is undefined.

**P2 — Discrepancy between layers is not an incident.**  
Any observation that "INBOX.md says X but `arch govern inbox` says Y" is Expected Divergence Class A. It does not warrant a ticket, a patch, a reconciliation commit, or a TENSION. Treating it as actionable is the misuse. The only valid response is to use the correct layer for the task at hand.

**P3 — TENSIONs cannot use INBOX.md as evidence of operational state.**  
INBOX.md may only be cited in a TENSION as evidence of write history: "at time T, an agent wrote X." It cannot be cited as evidence that X is currently true. Using INBOX.md to establish current state in a governance argument is a category error that invalidates the argument.

**P4 — Semantic collapse between layers is architecturally forbidden.**  
No artifact, command, or process may be designed to make Layer 1 (event log) and Layer 2 (state projection) appear equivalent or interchangeable. INBOX.md must not be regenerated to match live state. `arch govern inbox` must not accumulate historical trace to match the file. The overloaded surface that tries to be both is the root cause of the pressure this ADR resolves.

**P5 — Operational truth is permitted to be incomplete.**  
`arch govern inbox` does not need to surface everything that was ever written to INBOX.md. A projection that is current and accurate for its defined scope is correct, even if it omits events that exist only in the historical log. The absence of an event in the live view is not evidence that the event did not occur — it is evidence that the projection does not retain historical trace, which is by design.

---

## False Correction Hazard

Any attempt to reconcile heterogeneous layers — making INBOX.md match `arch govern inbox`, or vice versa — is a **false correction**. It is not optimization, cleanup, or maintenance. It is model corruption.

False correction is the specific failure mode this ADR exists to prevent. It arises from a predictable pressure: an agent observes apparent inconsistency and interprets it as a defect requiring repair. The "repair" destroys the property that made the inconsistency meaningful in the first place.

**Why it feels correct:** The impulse to fix visible inconsistency is structurally indistinguishable from legitimate bug-fixing. It reads as diligence. The damage is invisible at the moment of action and only becomes apparent when the historical trace or the projection accuracy degrades.

**Why it is a category error:** Layers 1 and 2 are not replicas with drift — they are different kinds of thing. A mismatch between a write history and a live computation is not a synchronization failure. It is the normal output of two systems with different observation rules operating independently, which is the intended design.

The label "false correction hazard" is intentional. It classifies the error at the level of intent, not outcome. An agent that patches the event log to match the live view has made a false correction even if the resulting state appears consistent. Apparent consistency achieved by collapsing layers is not correctness — it is loss.

---

## Divergence Protocol

When an agent observes a discrepancy between layers, the following protocol applies:

**Step 1 — Classify the observation.**  
Is the discrepancy within a single layer (e.g., two entries in `.arch/escalations.jsonl` that contradict each other)? That is an intra-layer integrity violation and may require action within that layer's rules. Is the discrepancy between layers (e.g., INBOX.md count differs from `arch govern inbox` count)? That is Expected Divergence Class A — proceed to Step 2.

**Step 2 — Verify own-layer invariants.**  
For each layer involved: are its internal invariants satisfied? INBOX.md: is it append-only and unmodified? Layer 2 sources (`docs/tasks/`, `.arch/escalations.jsonl`): are task statuses and escalation records consistent with their own schemas? If an intra-layer invariant is violated, address it within that layer. If all intra-layer invariants hold, the cross-layer divergence is not actionable.

**Step 3 — Record and stop.**  
If the divergence is cross-layer and all intra-layer invariants hold: record the observation in the session log or as a THINK note if it reveals a pattern. Do not create a TENSION. Do not create a task. Do not escalate. A cross-layer divergence that violates no intra-layer invariant is diagnostic signal, not governance incident. The observation has value. The action does not.

**What "record and stop" prevents:**  
It kills the fix reflex. It prevents silent degradation (ignoring the finding entirely). It prevents governance noise (creating a TENSION for an expected structural property). The observation is preserved without manufacturing a false problem.

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

## Referenced-by
**Files:** cli/src/main/ts/application/use-cases/govern-system.ts, .arch/
**Note:** Epistemic layer separation — govern enforces event log/state projection/governance boundary
