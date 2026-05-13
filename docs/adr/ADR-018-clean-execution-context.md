# ADR-018: Adversarially Robust Epistemology & Graded Integrity

**Date:** 2026-05-13
**Status:** ACCEPTED
**Deciders:** Gemini CLI, Human Auditor

---

## Context
The "Graded Integrity" model (Rev. 2) solved governance rigidity but introduced new risks: "MEDIUM collapse" (semantic noise), lack of provenance for inferred history, and potential for agents to "game" violation decay curves. We must transition from a reporting system to a **Truth Calibration Layer** that is resilient even when its own rules are known.

## Decision
Implement **Adversarially Robust Epistemology** through traceable provenance and non-decaying reputation anchors.

### 1. Hardened Integrity Scale & Provenance
Every metric and integrity score must be backed by an **Epistemic Digest**:

| Level | Provenance Requirement | Confidence Cap |
|-------|------------------------|----------------|
| **HIGH** | Explicit baseline snapshot (file-hash based) + zero worktree drift. | 1.0 |
| **MEDIUM** | Inferred baseline with **Traceable Digest** (Git-range + Inference Method ID). | 0.7 |
| **LOW** | Unverifiable history or significant environmental noise. | 0.3 |
| **INVALID** | Structural protocol breach. | 0.0 |

**Inference Invariant:** An inferred baseline without a versioned `method_id` and a specific `git_rev_range` is automatically downgraded to **LOW**.

### 2. Anti-Gaming: Non-Decaying Reputation Anchors
While operational violations (P2) decay to allow system recovery, **Structural Integrity Breaches (P0)** are anchored to the system's lifetime audit log:
- **Operational Score (Decaying):** Tracks process health (e.g., missing Hansei). Recovers over time.
- **Reputation Anchor (Lifetime):** A non-decaying count of P0 breaches (e.g., false verification claims). 
- **The Gaming Guard:** An agent/task-class with a high Reputation Anchor count faces a **permanent multiplier** on its violation weight. Waiting for scores to "cool down" does not erase the structural history.

### 3. Identity Integrity & Attribution Anchors
Authorship must be traceable and un-launderable:
- **AGENT_ID as Constitutional State:** Every action must be attributed to a first-class ID. Shared or anonymous execution is a **LOW** integrity signal.
- **Authorship vs. Execution:** Metrics must distinguish between the `author_id` (who wrote the plan) and `exec_id` (who ran the tool). 
- **Handoff Provenance:** Task reassignment must be recorded as an event in `EVENTS.md`. Post-hoc reattribution is forbidden.

### 4. Witnessability & Scope Semantics
Append-only history must be witnessed to prevent "local rewrite" fraud:
- **Witnessed Checkpoints:** Calibration is anchor-locked by **Git Tags** or **Human-Signed Hashes** in `docs/WITNESS.md`.
- **Invalidation Scope:** "The Period" for INVALID calibration is defined as the range between the current `HEAD` and the last **Witnessed Checkpoint**. A single integrity breach invalidates the entire window since the last witness.

### 5. Resilient Calibration (Second-Order Observability)
`arch report` will no longer report "The Truth." It will report:
- **Calibrated Value:** The weighted average of the observable.
- **Integrity Entropy:** The ratio of LOW/MEDIUM data in the set.
- **Evidence Provenance:** A link to the git range and logs that generated the result.

## Rationale
In an adversarial environment, simplicity is a vulnerability. By anchoring truth to the Merkle tree and the lifetime audit log, we ensure that the system's "memory" of integrity is longer than the agent's strategy for gaming the rules. We accept entropy but **bound its influence** through explicit provenance.

## Consequences
**Positive:**
-   Resilience against "ritual compliance" and "decay gaming."
-   Reproducible metrics through traceable inference provenance.
-   Clear visibility into the "Integrity Entropy" of the workspace.

**Negative:**
-   Implementation of the "Reputation Anchor" requires persistent, non-archived storage.
-   Higher cognitive load for humans auditing the "Calibrated" reports.

---
