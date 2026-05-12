# IDENTITY.md
<!-- Frozen system boundaries. This document is a constraint, not an inspiration. -->
<!-- Updated: 2026-05-12 | §8 added: Epistemic Plane Separation -->

<!-- Re-entry index — fast path back to the relevant constraint:
     "Is this feature inside ARCH?"                   → §2 Scope Boundaries + §5 Rejection Criteria
     "Can this LLM output affect a governance gate?"  → §7 Deterministic Core Invariant (Prohibited table)
     "Should this event go to Chronicle?"             → §8 Epistemic Plane Separation (Three Domains)
     "Is THINK/REFLECT making an enforcement claim?"  → §7 Governance: the mandatory split
     "Does this change what ARCH IS?"                 → §1 Definition (frozen — do not rephrase)
     "What's the implementation priority?"            → §6 Current Priority Lock -->

---

## 1. Definition

> **ARCH is a git-native operational protocol for human+AI collaborative work.**

This sentence is frozen. Do not rephrase it. Do not extend it.

---

## 2. Scope Boundaries

### Inside ARCH

- Task execution protocol (capture → think → do → review → retro)
- Operational memory (tasks, commits, decisions, failures)
- Decision traceability (ADRs, rationale, rejected alternatives)
- Drift detection (structural violations, dead references, orphan work)
- Routing (which model, provider, and strategy executes which task class)
- Governance (what must be enforced, not what should be encouraged)
- Agent protocols (instructions for how AI agents operate within the system)

### Outside ARCH

- Chat UI or conversational interface
- CRM, project management SaaS, Jira replacement
- Personal journaling, life operating system, second brain
- Notification system, dashboard, reporting layer
- Any feature that requires ARCH to have opinions about the user's goals rather than their work

**The rule:** if a proposed feature would make ARCH useful without a git repo and a set of tasks to execute, it is outside ARCH.

---

## 3. System Layers

These five layers are distinct. Conflating them causes fragmentation.

| Layer | What it is | What it is not |
|-------|-----------|----------------|
| **Protocol** | The rules governing how work moves: task states, phase transitions, artifact formats | A framework, a methodology, a best-practices guide |
| **Runtime** | The CLI commands and use-cases that mechanize the protocol | A scheduler, an orchestrator, an autonomous agent |
| **Memory** | Stored operational history queryable for patterns and causality | Merely storage. A database or archive is necessary substrate — not the thing itself. Memory requires queryability and causal inference. Storage without those is history, not memory. |
| **Policies** | Machine-enforced structural invariants derived from accumulated memory | Rules a human follows, conventions, linting |
| **Agents** | LLM actors that operate within the protocol under the runtime | Autonomous processes, co-pilots, assistants, chatbots |

**Current state (2026-05-11):** Protocol and Runtime are operational. Memory is stored but not queryable. Policies do not exist. Agents are instruction documents, not runtime components.

**Critical distinction:** `THINK.md` and `DO.md` are agent instruction documents. They are Protocol layer artifacts. A Multiagent Runtime does not exist until there is a scheduler, message passing, shared state, and a conductor. Protocols ≠ Runtime.

---

## 4. Compounding Definition

ARCH has a moat when: **if the repo were deleted, the system's accumulated inferences could not be cheaply reconstructed.**

Today that condition is not met. The repo contains history and protocol. No inference has been generated that does not exist in some other form elsewhere.

The condition will be met when:
- `arch ask` produces causal patterns derived from the specific operational history of this repo
- The Chronicle captures event causality, not just timestamps
- Cross-task distillation surfaces non-obvious patterns that no human extracted manually

Until then: ARCH is a very good protocol. It is not yet cognitive infrastructure.

---

## 5. Rejection Criteria

Reject any proposed feature that meets one or more of the following conditions:

- **Adds abstraction without removing friction.** If a new layer requires learning new concepts without eliminating existing ones, reject it.
- **Simulates automation through human discipline.** If a feature only works when humans follow naming conventions, commit hygiene, or manual linking protocols, it is not automated — it is ceremonial. Reject or fix.
- **Opens a governance layer before memory exists.** Policy without queryable memory is bureaucracy. Policies may only be proposed after `arch ask` is operational.
- **Optimizes local elegance over systemic leverage.** A beautiful implementation of a low-leverage feature is worse than a mediocre implementation of a high-leverage one.
- **Requires identity to be undefined.** If a feature could belong to three different versions of ARCH depending on interpretation, the feature is premature. Resolve identity first.
- **Future-proofs against unvalidated requirements.** Build what is needed now. Extensibility that has no confirmed use case is complexity with a delay.

---

## 6. Current Priority Lock

The following order is a hard dependency chain, not a preference:

1. This document (done)
2. `arch ask` v1 — grep-based, primitive, real. No embeddings. No vector DB. First stupid useful answer.
3. Chronicle causal graph — event causality, not timestamps
4. Cross-task pattern distillation
5. Policy engine

Opening step N before closing step N-1 is how this system fragments.

---

## 7. Deterministic Core Invariant

> **LLMs may assist semantic compression under ambiguity, but must never be the source of truth for execution, governance, causal mutation, or policy enforcement.**

This is a constitutional constraint. It is not a guideline, best practice, or suggestion. Every feature that touches the LLM boundary must pass this test before implementation begins.

**Operational test:** If the LLM disappears tomorrow, the system must remain correct — only less convenient. If the answer is "no, it breaks," the feature is not designed yet.

### Permitted

| Use | Justification |
|-----|---------------|
| Belief synthesis | Given valid facts, what is the dominant interpretation? Ambiguity is genuine — multiple true facts conflict. |
| Explanation layer | Narrating what the graph already knows. Structure → human-readable decision. LLM explains; it does not decide. |
| Conflict surfacing | Heuristic signal: "these two decisions appear incompatible." Emits a signal for arbitration. Never commits truth. |
| Cross-task pattern distillation | Semantic abstraction over structured operational history. Pattern emergence that does not reduce to SQL. |
| Human-facing summarization | Translating JSONL, graph output, or structured data into decision-quality prose. |

### Prohibited

| Domain | Reason |
|--------|--------|
| Retrieval and ranking | Scoring must be explainable edge by edge. Unexplainable ranking is astrology, not epistemology. |
| Governance enforcement | "Seems reasonable to the model" is not a rule. Governance by LLM is automated corruption. See the split below. |
| Causal graph mutation | LLMs emit signals. Arbitration commits truth. Collapsing this boundary destroys the epistemic architecture. |
| Task extraction and entity linking | Commit parsing, branch mapping, task references: deterministic before probabilistic, always. |
| AC verification as a gate | Pass/fail on a governance decision requires a deterministic, auditable answer. Not a confidence score. |

### Governance: the mandatory split

Governance is not a single concept. It is two structurally distinct layers that must never be conflated.

**Governance Enforcement** — deterministic, auditable, reproducible.

May: block transitions, require escalation, enforce policy, assign focus by rule, archive tasks, validate completion.

Must never: depend on LLM judgment for any of the above. A governance enforcement decision must be reproducible by re-running the same rule against the same state. If it isn't, it is not enforcement — it is a guess.

**Governance Analysis** — LLM-permitted proposal layer.

May: summarize system state, detect possible drift, surface tensions, propose replenishment, suggest kaizen, generate INBOX items.

Must never: mutate task state directly, satisfy policy gates, close tasks, bypass escalation, or accumulate implicit authority over time.

This layer emits signals and proposals. It never emits truth. The distinction is architectural, not stylistic.

**The slippery slope to name and refuse:**

> "THINK already participates in govern, so it can also…"

This argument is invalid. It will be used. It must be rejected on contact. THINK participates in the *analysis* layer that governance *triggers* — not in enforcement itself. That participation does not extend authority. It never becomes a precedent for LLM judgment entering enforcement decisions.

Degradations do not begin with a single large betrayal. They begin with a small semantic continuity: one reasonable exception, one "it's basically the same," one "confidence is high enough." Freeze the boundary before it is tested.

**Current naming tension:**

`arch govern` triggers THINK (via `arch conduct`). This is technically correct — the enforcement rules run first, deterministically; THINK runs afterward in the analysis layer. But the naming conflates enforcement with reflection and makes the boundary invisible to anyone reading the command surface.

The target architecture separates these explicitly:

```
arch govern   → Governance Enforcement (deterministic, always correct)
arch reflect  → Governance Analysis (LLM, proposals only, never authority)
```

`arch govern` may trigger `arch reflect` as an optional side-effect, but they are not the same layer and must not share a name. **This separation is a future implementation target, not yet complete.** Until it is done, the current behavior must not be cited as precedent for expanding THINK's authority.

**A system survives by invariants that are comprehensible to anyone entering the codebase — not by private intentions of the original author.**

> **REFLECT may influence interpretation of system state but may never determine system state transitions.**

This is the authority invariant. REFLECT (THINK, synthesis, signal analysis) is a weather system — it reports conditions, surfaces risks, proposes classifications. GOVERN is air traffic control — it makes the final call on what changes. The weather system never cancels the flight.

Consequence: no output of REFLECT can be consumed by GOVERN as authoritative input. REFLECT emits pressure signals. Humans or GOVERN consume them. The decision to PROMOTE, DEMOTE, or transition any artifact is never REFLECT's to make — regardless of deadline, confidence, or batching.

**Influence measurement is not optional.** Formal authority and actual authority are not the same thing. If humans consistently follow REFLECT's suggestions, governance authority drifts toward the LLM without any explicit decision to allow it. This is soft delegation — invisible, gradual, and harder to reverse than explicit authority grant. To prevent it: every adjudication decision must record what REFLECT suggested and whether the human diverged. Low divergence rate over time is a warning signal, not a success metric. The system is not "human-governed" if the human is ratifying REFLECT suggestions without exercising independent judgment.

> **ARCH should not only remember decisions. It must learn where its own categories fail.**

This is the test for whether ARCH is operational infrastructure or an externalized checklist. Most serious architectural failures do not come from broken rules — they come from badly named categories that pass every check.

### Architecture

```
deterministic substrate
        ↓
signal generation
        ↓
arbitration
        ↓
truth graph
        ↓
LLM synthesis / explanation
```

LLM at the bottom of the stack. Never at the top.

**Ratio target:** 90% deterministic core, 10% LLM interface. Inverting this is not innovation. It is architectural debt with a latency cost and no audit trail.

**The decay pattern to avoid:** Using LLM because it avoids designing the ontology. Pereza arquitectónica disguised as innovation. The competitive advantage of ARCH is needing LLMs less than comparable systems — because the system already knows how to think before it asks.

---

## 8. Epistemic Plane Separation

> **Chronicle encodes only events whose meaning derives from the content of work. System control events are not domain-causal and must not enter the causal graph.**

This is a constitutional constraint on what can be projected as causal truth within ARCH. It is not a logging policy or an architectural preference. It defines the boundary of what can become *knowledge* — as opposed to what happened operationally.

### Three Domains of Signification

These three domains must never be conflated:

**Domain 1 — Domain-causal events → Chronicle**

Events whose meaning depends on *what was done* — the content, relationships, and consequences within the task domain.

Examples: `TASK implements ADR`, `TASK caused_by TASK`, `TASK violates invariant`.

Chronicle is the only repository authorized to receive these. Their significance is semantic: they describe how domain entities relate.

**Domain 2 — Control-operational events → Git history / system logs**

Events whose meaning is the operational state of the system as a scheduling machine — queue management, cycle execution, flow control.

Examples: focus selection, replenishment triggers, conduct cadence, task sequencing.

These events must not enter Chronicle. Their meaning is mechanical, not semantic. Git history is already a complete, auditable record of all control-layer decisions. Projecting control events into the causal graph would contaminate domain-causal inference with scheduling noise and make the graph epistemically unreliable.

**Domain 3 — Semantic ruptures → Chronicle (ANDON_HALT class)**

Events where a control-layer failure directly constitutes a domain-semantic failure — where machine stoppage is evidence that a domain invariant was violated.

Examples: archival blocked by missing Hansei section, governance halt due to constraint violation.

These events may emit to Chronicle. The rationale: the control layer stopped not because of a scheduling failure but because the domain produced something that violated a known invariant. That violation is domain-causal evidence. The system halted because the work content was wrong — not because the queue was empty.

### The Constraint

Chronicle receives Domain 1 and Domain 3 events only. The following arguments must be rejected on contact:

- *"Useful for debugging"* — operational utility does not confer epistemic legitimacy.
- *"We already have the hook"* — infrastructure does not grant semantic authorization.
- *"Similar enough to a domain event"* — similarity arguments cross the plane. Similarity is not identity.

Any argument that a control event should enter Chronicle for convenience is an argument to contaminate the causal graph. The graph's value depends entirely on the integrity of what it encodes.

### Why This Is Constitutional, Not Architectural

An architectural decision governs how a system is built. A constitutional constraint governs what can be interpreted as true within the system.

This principle is constitutional because it restricts which parts of ARCH's own execution can become causal knowledge about its domain. Without it, the boundary between the system's mechanical behavior and the system's understanding of its domain dissolves. Once dissolved, every scheduling decision becomes a candidate for causal inference, and Chronicle ceases to be epistemically meaningful.

**The failure mode to name and refuse:**

> "govern should emit signals for focus decisions because that's useful context."

This argument is a plane collapse. `arch govern` deciding to focus TASK-X is machine behavior — it tells you what the queue did next, not why domain entities are causally related. Accepting it means the system begins confusing its own operational mechanics with knowledge about its domain. A system that cannot make this distinction cannot generate reliable causal inference about anything.

**The current implementation is correct by this principle.** `arch task done` emits domain-causal signals (task→ADR, task→task). `arch govern` normal path emits nothing to Chronicle — it operates as a scheduling machine and leaves its trace in git. `arch govern` error path emits to Chronicle because archival failures are Domain 3 events: control stopped because domain content violated a known invariant.
