# IDENTITY.md
<!-- Frozen system boundaries. This document is a constraint, not an inspiration. -->
<!-- Updated: 2026-05-11 -->

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
