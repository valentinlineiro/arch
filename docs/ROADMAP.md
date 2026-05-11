# ROADMAP.md
<!-- ARCH Strategic Roadmap | v0.6.0 → 1.0.0 → 2.0 -->
<!-- Updated: 2026-05-11 -->

## Identity

> **ARCH is a git-native operational protocol for human+AI collaborative work.**

This definition is frozen. ARCH is not an autonomous AGI swarm, a no-code platform, a chat UI, a SaaS workspace, a Jira replacement, or a second brain.

## Fundamental Principle

> Each new layer must reduce net friction. If a proposed feature increases complexity without eliminating cognitive load, reject it.

## Evaluation Invariant

> **Implemented ≠ Operational ≠ Compounding**

These are three distinct states. Conflating them produces roadmap inflation and bad decisions.

| State | Meaning |
|-------|---------|
| **Implemented** | The code exists and the pipeline runs |
| **Operational** | The user learns less than they save. Friction reduction is net positive after ontology cost. |
| **Compounding** | The system generates accumulated advantage that cannot be reconstructed outside it |

A feature is `DONE` only when it is **Operational**. Implemented-but-not-operational is `PARTIAL`.

> **Calibration note on Operational:** ARCH has inherent ontology because the problem demands it. The correct bar is not "zero learning curve" — that would condemn protocol-layer features to permanent PARTIAL. The correct bar is: does the user get more back than they put in? That is measurable. "Zero ontology" is not.

## Current Priority Order

> Discipline over creativity. The order below is not a preference — it is a dependency chain. Opening a later step before closing an earlier one is how systems fragment.

1. ~~**`docs/IDENTITY.md`**~~ — shipped 2026-05-11
2. ~~**`arch ask`**~~ — **shipped 2026-05-11** — v1–v3: keyword scoring, cause grouping, match reasons, query intent classification, corpus authority hierarchy. Causal-conditioned retrieval: `causalRelevance()` activates only edges with direct path to query entities (log-compressed, dominant-per-pair). Scoring and reasoning share a single activation predicate. **Operationally functional; not yet validated against real daily use.**
3. ~~**Chronicle causal graph + signal arbitration**~~ — **shipped 2026-05-11** — causal graph v1 (ADR-014) + signal arbitration layer (ADR-015). Two invariants enforced: Query Isolation, Arbitration Determinism. Backward loop: lifecycle events → signal layer → cross-domain arbitration → graph mutation. Signal lifecycle: pending → applied | conflicted | stale.
4. **Cross-task pattern distillation** — the moat becomes real when the system generates non-reconstructable knowledge
5. **Policy engine** — governance only after memory and identity exist; policy without memory is automated bureaucracy

Steps 2 and 3 are implemented. The question is whether they are operational — whether real use produces compounding advantage. That can only be answered by using them.

---

## Legend

| Status | Meaning |
|--------|---------|
| `DONE` | Operational — reduces real friction, verified by use, not just by existence |
| `IN PROGRESS` | Active task or ADR in flight |
| `PARTIAL` | Foundational work exists; key gaps remain |
| `NOT STARTED` | No task, ADR, or IDEA has begun execution |

---

## Phase 0 — Conceptual Consolidation

**Objective:** Close the mental model. Freeze invariants: what ARCH is, what it is not, and the operational model that governs it.

> **`docs/IDENTITY.md` written 2026-05-11.** System boundaries, layer distinctions, compounding condition, and rejection criteria are now frozen. The unresolved gap that remained is semantic stability — core concepts are still renamed across sessions. That is the only open item in this phase.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Identity definition frozen | `DONE` | [docs/IDENTITY.md](IDENTITY.md) — definition, scope, layers, compounding condition, rejection criteria |
| Operational model frozen (TASK / THINK / DO / REVIEW / RETRO / GUIDELINES / ADR) | `DONE` | [docs/GOVERNANCE.md](GOVERNANCE.md) |
| Semantic stability (no constant renaming of core concepts) | `PARTIAL` | — |
| `docs/IDENTITY.md` — unifying theory of what ARCH is across all layers | `DONE` | **Prerequisite for Phases 3–8.** [docs/IDENTITY.md](IDENTITY.md) — definition, scope boundaries, layer distinctions, compounding condition, rejection criteria, priority lock. |

---

## Phase 1 — Friction Reduction

**Objective:** Eliminate ceremonial work. The system should feel like an operational copilot, not a documentation burden.

> **Phase status:** Infrastructure exists. Operational friction reduction not yet validated. A new user still needs to learn internal ontology to use the system effectively. Until that changes, Phase 1 is not complete.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| `arch capture` — intent capture with auto-generated task, ACs, complexity, context | `PARTIAL` | Pipeline implemented (ScaffoldTask + FinalizePromotion + ContextInference at scaffold time). ACs still require manual correction; context ranking not validated against real use. **Implemented, not yet Operational.** [TASK-219](archive/TASK-219.md), [IDEA-roadmap-arch-capture](refinement/IDEA-roadmap-arch-capture.md) |
| Auto Context Engine — infer relevant files, commits, ADRs, guidelines per task | `PARTIAL` | Infrastructure complete (ContextIndex v5 + feedback loop closed 2026-05-11 via FeedbackRepository + ExtractContextFeedback). Ranking does not yet consistently outperform human intuition. **Implemented, not yet Compounding.** [TASK-217](archive/TASK-217.md), [TASK-218](archive/TASK-218.md), [TASK-220](archive/TASK-220.md), [IDEA-roadmap-auto-context-engine](refinement/IDEA-roadmap-auto-context-engine.md) |
| Automatic entity linking — tasks↔commits, ADRs↔tasks, guidelines↔failures | `PARTIAL` | Links exist when naming conventions and commit hygiene are followed. Connectivity does not emerge automatically — it depends on human discipline. Inconsistent naming silently breaks the graph. Broken linking corrupts `arch ask`. [TASK-217](archive/TASK-217.md), [TASK-218](archive/TASK-218.md), [TASK-220](archive/TASK-220.md), [IDEA-roadmap-automatic-linking](refinement/IDEA-roadmap-automatic-linking.md) |
| Drift detection — structural validation | `DONE` | 20+ checks in DriftChecker: orphan tasks, dead refs, unapplied ADRs, stale depends graph, census, escalation maturity. Violations are detected reliably. [ADR-013](adr/ADR-013-two-tier-drift-detection.md), [TASK-215](archive/TASK-215.md) |
| Drift intelligence — causal reasoning about why drift occurs | `PARTIAL` | Validator is operational; cause reasoning is absent. The system knows *that* something is wrong, not *why* it keeps happening. [IDEA-roadmap-drift-detection](refinement/IDEA-roadmap-drift-detection.md) |

---

## Phase 2 — Memory System

**Objective:** Move from documentation to operative memory. ARCH should understand, not just record.

> **Current reality:** `arch ask` is now a causal-conditioned retrieval engine. v1–v3 delivered keyword scoring, query classification, cause grouping, and match reasons. The causal integration is complete: `causalRelevance()` activates only edges with direct paths to query entities (path-conditioned, not global — TASK-184 is only boosted when the query references TASK-220 directly). Signal arbitration layer (ADR-015) closes the backward loop: lifecycle events generate signals, cross-domain corroboration commits inferred edges, contradictions surface for human review, stale signals drain automatically. The open question is no longer architecture — it is whether real daily use produces observable compounding advantage.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Layer 1: Operational Memory (tasks, commits, retros, failures) | `PARTIAL` | docs/archive/ (198 archived + 20 active tasks), docs/RETRO.md — stored, not queryable |
| Layer 2: Decision Memory (ADRs, rationale, rejected alternatives) | `DONE` | docs/adr/ (13 ADRs) |
| Layer 3: Pattern Memory (bug classes, workflow failures, productivity patterns) | `PARTIAL` | [docs/PRINCIPLES.md](PRINCIPLES.md), [docs/KAIZEN-LOG.md](KAIZEN-LOG.md) — distilled manually, not automatically |
| Layer 4: Semantic Memory (conceptual relationships between entities) | `PARTIAL` | ContextIndex v5 + feedback loop closed 2026-05-11. Inference adjusts boosts from completed task signals. Not yet consistently superior to human judgment. [TASK-219](archive/TASK-219.md), [TASK-220](archive/TASK-220.md) |
| `arch ask` — causal-conditioned memory retrieval | `PARTIAL` | **CRITICAL INFLECTION POINT.** Before `arch ask`: protocol system. After: cognitive infrastructure. **v1–v3 + causal integration shipped 2026-05-11.** Scoring: `text_score × causalMultiplier` where multiplier = `1.0 + log(1 + Σ edgeDelta)` over activated edges — path-conditioned, log-compressed, dominant-per-pair. Activation predicate shared by scoring and reasoning. Query Isolation Invariant: pending signals never touch scoring. Cause groups surface recurring failure tokens across archive. Match reasons explain every result explicitly. No embeddings, no LLM, no vector DB. Not yet validated as operationally compounding. [IDEA-roadmap-memory-queries](refinement/IDEA-roadmap-memory-queries.md) |

---

## Phase 3 — Routing Engine

**Objective:** Separate intent from execution. ARCH decides model, cost, context, and depth — not the human.

> **Clarification:** Current routing is heuristic, not intelligent. `arch.config.json` defines `strategies[taskClass][taskSize]` as ordered provider arrays. The registry evaluates them by availability. This is rule-based routing, not signal-driven routing. Correct and useful; not to be confused with something more sophisticated.
>
> **Strategic status:** Identity is now frozen. Routing is operational. The open question is whether routing decisions actually improve execution quality — or merely select providers. Strategy routing ≠ intelligence routing. The feature is done; whether the phase produces compounding advantage depends on whether routing signals evolve beyond static configuration.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Rule-based routing by task class, size, and provider | `DONE` | [ADR-011](adr/ADR-011-unified-provider-strategies.md), [IDEA-roadmap-routing-engine](refinement/IDEA-roadmap-routing-engine.md) |

---

## Phase 4 — Policy Engine

**Objective:** Convert `arch review` into governance. Structural constraints become machine-enforced invariants.

> **Gated on:** `docs/IDENTITY.md` (Phase 0) and `arch ask` (Phase 2). Policy without memory is automated bureaucracy. Policy without identity is policy for an undefined system. Do not open this phase until both prerequisites exist.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Structural policies (forbidden deps, arch boundaries, naming invariants, mandatory tests) | `NOT STARTED` | [IDEA-roadmap-structural-policies](refinement/IDEA-roadmap-structural-policies.md) |
| AI-proposed policies (ARCH detects patterns → proposes guidelines → human approves) | `NOT STARTED` | [IDEA-roadmap-ai-proposed-policies](refinement/IDEA-roadmap-ai-proposed-policies.md) |

---

## Phase 5 — Temporal & Energy Model

**Objective:** Model operational reality — cognitive load, WIP, fatigue, and recovery cycles.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Operational load tracking (WIP, cognitive cost, rework, fatigue) | `NOT STARTED` | [IDEA-roadmap-operational-load](refinement/IDEA-roadmap-operational-load.md) |
| Adaptive planning (task states beyond READY/IN_PROGRESS: blocked-by-energy, high-cognitive-cost) | `NOT STARTED` | [IDEA-roadmap-adaptive-planning](refinement/IDEA-roadmap-adaptive-planning.md) |

---

## Phase 6 — Domain Packs

**Objective:** Convert ARCH into a universal protocol applicable beyond software engineering.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Software pack | `PARTIAL` | (implicit in current design) |
| Startup / Household / Personal packs | `NOT STARTED` | [IDEA-roadmap-domain-packs](refinement/IDEA-roadmap-domain-packs.md) |

---

## Phase 7 — Multiagent Runtime

**Objective:** Formalize the agent layer. Only viable once memory, routing, and policies exist.

> **Current reality:** THINK.md and DO.md are agent instruction documents, not a runtime. There is no scheduler, no message passing, no shared state, no conductor. What exists is command orchestration primitives. A multiagent runtime requires all of: Historian, Planner, Reviewer, Conductor, Optimizer. None exist. Estimated completion: ~15%.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| THINK / DO agent protocols | `DONE` | docs/agents/THINK.md, docs/agents/DO.md — instruction documents, not runtime components |
| Chronicle — Causal Graph + Signal Arbitration | `PARTIAL` | **Shipped 2026-05-11.** Two-layer epistemic architecture. **Graph layer** (`causal-graph.jsonl`, ADR-014): committed truth. 6 relation types, epistemic metadata, append-only corrections, belief synthesis (dominant/competing/superseded). **Signal layer** (`causal-signal.jsonl`, ADR-015): observed hypotheses from lifecycle events. Arbitration: cross-domain corroboration → inferred edge committed; contradiction → conflict record; expiry after 3 review cycles → stale. Two invariants: Query Isolation (signals invisible to queries), Arbitration Determinism (same input → same output). `arch causal add|show|weaken|invalidate|synthesize|arbitrate`. Gap: signal generation not yet hooked into `arch task done` or `arch govern`. [ADR-014](adr/ADR-014-causal-graph-schema.md), [ADR-015](adr/ADR-015-causal-signal-arbitration.md), [TASK-224](tasks/TASK-224.md), [TASK-225](tasks/TASK-225.md) |
| Planner / Historian / Reviewer / Conductor / Optimizer agents | `NOT STARTED` | [IDEA-roadmap-multiagent-runtime](refinement/IDEA-roadmap-multiagent-runtime.md) |

---

## Phase 8 — The Moat

**Objective:** Accumulate operational memory that is irreplaceable. The competitive advantage is not the CLI — it is the institutional knowledge that compounds inside the repo.

> **Current reality:** ARCH has potential for a moat, not a moat. The moat begins when the system knows something that cannot be reconstructed outside it. Today, if the repo were lost, no inference would be lost — only history and protocol. That is the gap. `arch ask` + Chronicle causal semantics are what close it.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Operational memory accumulation | `IN PROGRESS` | docs/archive/ (198 archived + 20 active tasks), docs/KAIZEN-LOG.md |
| Causal event graph (Chronicle) | `PARTIAL` | Two-layer architecture live: graph (committed truth) + signal (observed hypotheses). `arch ask` causal integration complete — scoring is path-conditioned on active beliefs. Backward loop closed: lifecycle events → signal → arbitration → graph mutation. Real graph data sparse — moat begins when task closures consistently assert relations and signal corroboration produces inferred edges. Signal generation hooks (task done, govern violations) not yet wired. |
| Cross-task pattern distillation | `NOT STARTED` | [IDEA-oracle-archive-distillation](refinement/IDEA-oracle-archive-distillation.md) |
