# Next Phase: Proportional Protocol + Active Memory
**Date:** 2026-05-18
**Status:** DRAFT — awaiting operator decision on each track

## Context

Hardening phase complete as of 2026-05-18:
- ApprovalPresent, ArchiveMetaIntegrity, TaskTemplateCompliance: all clean
- CLI surface unified under four verb domains (TASK-250)
- Tiered Hansei/Approval obligations in effect (TASK-934)

System Review: OK. Pre-existing warnings: PriorityDrift (TASK-919 ordering), Census (1231 lines), HanseiPresent (pre-TASK-195 archive).

The next phase is not more hardening. It is reducing the operator cost of using the governance surface correctly, then building epistemic advantage on top of a clean base.

---

## Track 1: Proportional Protocol

**IDEA:** `docs/refinement/IDEA-proportional-protocol.md`
**Priority:** 1 (highest leverage)
**Estimated size:** M

**Problem it solves:** Ceremony cost is flat across task sizes. Ten XS fixes a day creates operator resentment or governance bypass.

**What it changes:**
- `arch task capture` generates stripped XS templates (one AC, no DoD section, no Hansei placeholder) for `6-writing` and `7-operations` classes
- XS close path skips the interactive Hansei wizard when no trigger condition applies (fast-path through `arch task done`)
- XS DoD section made explicitly optional in TASK-FORMAT.md and the linter

**What it does not change:** task file requirement, AC requirement, L3 gate conditions, Auditor bypass logic.

**Sequencing note:** TASK-934 was the prerequisite (tiered obligations). This is the follow-on that closes the remaining friction gap on the creation and close path.

---

## Track 2: Active Constraint Injection

**IDEA:** `docs/refinement/IDEA-active-constraint-injection.md`
**Priority:** 2 (best Moat activation)
**Estimated size:** M

**Problem it solves:** ADRs, tensions, and causal patterns are passive. An agent that never queries them operates on generic priors. Violations surface at `arch review`, not before implementation.

**What it changes:**
- `arch task start TASK-XXX` gains a constraint preflight step
- Preflight scans context files against ADR store, tensions, and causal signal log
- Emits a structured `## Constraint Preflight` block to stdout before IN_PROGRESS commit
- Advisory only — not a blocker

**Key invariant:** preflight is read-only, stdout-only. No writes. Agent can proceed regardless.

**Why now:** the context index, causal signal log, and ADR store are all populated. The pieces exist; this wires them to the execution moment.

---

## Track 3: Correction Signal Schema

**IDEA:** `docs/refinement/IDEA-correction-signal.md`
**Priority:** 3 (highest long-term value, requires discipline to implement correctly)
**Estimated size:** M

**Problem it solves:** Human corrections contain repo-specific knowledge that currently goes nowhere. Raw capture is a swamp. Structured capture with low authority + corroboration requirement preserves the Deterministic Core Invariant.

**Schema summary:**
```
signal_id, timestamp, source_type, task_ref, file_refs, adr_refs,
category (Hansei vocab), correction_kind (factual|style|authority|scope),
summary (1 sentence), corroboration_count, authority (low|medium|high), status
```

**Corroboration → TENSION → injection pipeline:**
```
correction event → signal (authority: low)
  → ×3 corroborations → TENSION (clustered)
    → operator promotes → authority: high
      → eligible for Active Constraint Injection preflight
```

**Why this ordering matters:** if you build Active Constraint Injection first (Track 2), you have a delivery mechanism ready when the first high-authority correction signals arrive. The tracks compound.

---

## Sequencing decision

| Order | Track | Blocker if skipped |
|---|---|---|
| 1 | Proportional Protocol | Ongoing operator friction; compliance-debt loop |
| 2 | Active Constraint Injection | Passive knowledge stays passive |
| 3 | Correction Signal | No correction-to-constraint pipeline; knowledge dies at REVIEW_FAIL |

Each track is independently implementable. Track 3 delivers more value if Track 2 is already live (injection endpoint exists). Track 2 delivers more value as signals accumulate over time (more constraints = richer preflight). Track 1 has no dependency on the others.

**Recommended start:** Proportional Protocol. It reduces the operator cost of running the governance surface that the other two tracks depend on.

---

## What is explicitly deferred

- **Temporal Pattern Layer** — valuable but 2.0/late 1.x work. Requires a clean correction corpus first.
- **Semantic Collision Detection** — dangerous if shallow (string-matching ADR cop → false blocks → ignored). Narrow and high-confidence only, after Correction Signal is operational.
- **Expand L3 to M tasks** — trust-boundary change, not a simplification tweak. Not while hardening is still recent.
- **Backlog Compression** — if Census remains above budget after current cleanup, evaluate then.
