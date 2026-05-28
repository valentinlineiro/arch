# ROADMAP.md
<!-- ARCH Strategic Roadmap | v1.0.0 → 2.0 -->
<!-- Updated: 2026-05-18 -->

<!-- ARCH-REPORT:START -->
#### ARCH Materialized Status
**Generated:** 2026-05-28T09:49:39.176Z
**Sprint ID:** sprint/v1.2.1-2026-05

| Status | Count |
| :--- | :--- |
| Ready | 23 |
| In Progress | 11 |
| Review | 0 |
| Blocked | 1 |
| Done (Archive) | 426 |

**Audit Score:** 100/100
<!-- ARCH-REPORT:END -->

## Identity

> **ARCH is a git-native operational protocol for human+AI collaborative work.**

This definition is frozen. ARCH is not an autonomous AGI swarm, a no-code platform, a chat UI, a SaaS workspace, a Jira replacement, or a second brain.

## What ARCH Is Actually Building

As of 2026-05-12, ARCH crossed a design threshold. The question is no longer "how does the system remember and execute better?" It is:

> **How does a system that understands its own structure prevent its interpretation layer from becoming accidental authority?**

This is epistemic governance design, not product development. The roadmap is no longer organized around features. It is organized around a single property:

> **Epistemic integrity under use pressure.**

The moat is not irreplaceable knowledge alone. It is irreplaceable knowledge that cannot be contaminated by its own interpretation layer. An ARCH that accumulates operational memory while allowing REFLECT to gradually shape governance decisions is not a compounding system — it is a system that corrupts its own truth structure over time.

**What this means for every phase:** features are evaluated not just by "does this reduce friction?" but "does this preserve the authority boundary under real use pressure?" Phases that increase intelligence without protecting authority are not progress. They are surface area for future corruption.

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

## Deterministic Core Invariant

> **LLMs may assist semantic compression under ambiguity, but must never be the source of truth for execution, governance, causal mutation, or policy enforcement.**

**Implementation gate:** Before any feature that involves an LLM is designed or built, it must pass: *"If the LLM disappears tomorrow, does the system remain correct?"* If the answer is no, the feature is not yet designed.

**Permitted:** belief synthesis, explanation layer, conflict surfacing (as signal), cross-task pattern distillation, human-facing summarization, governance *analysis* (proposals, INBOX summaries, Kaizen signals).

**Prohibited:** retrieval ranking, governance *enforcement*, causal graph mutation, task/entity extraction as primary method, AC verification as a gate.

**Governance is two layers, not one.** Enforcement is deterministic and must remain so. Analysis is the LLM-permitted proposal layer. They must not share a name or a command boundary. Current state: `arch govern` (enforcement) and `arch analyze` (analysis) are now explicitly separate at the command surface. The remaining work is not the split itself, but keeping future features from quietly re-blurring that boundary. See [docs/IDENTITY.md § 7](IDENTITY.md) — the slippery slope to refuse is named there.

Full treatment: [docs/IDENTITY.md § 7](IDENTITY.md).

> **Constitutional principles in IDENTITY.md supersede phase-level implementation assumptions in this document.** Where a roadmap entry and a constitutional constraint conflict, IDENTITY.md is authoritative.

---

## Phase Structure

The old linear priority list is replaced by four structural phases. These are not sequential milestones — they are concurrent concerns. But they have a dependency order: later phases depend on earlier ones being stable, not complete.

### Phase A — Constitutional Authority *(~80% closed)*

**What it is:** Freeze the invariants that prevent authority from leaking. REFLECT/GOVERN separation. LLM exclusion zones. Decision ownership. Signal vs state distinction.

**Status:** Mostly closed. IDENTITY.md §7 frozen. Deterministic Core Invariant frozen. REFLECT authority invariant frozen. Influence measurement introduced. `arch govern` / `arch analyze` command split is now structurally enforced. The remaining gaps are surface cleanliness and long-term boundary hardening: proportional obligations, trusted-metrics narrowing, and preventing future features from reintroducing silent authority leakage.

**This phase is never truly closed.** Every new feature that touches the REFLECT/GOVERN boundary is a Phase A test.

### Phase B — Signal System *(in progress)*

**What it is:** Structured epistemic pressure infrastructure. The goal is not to capture knowledge — it is to prevent false stabilization of categories. Weak signals (Layer 0), validated TENSIONS, decay pressure, promotion/demotion lifecycle, divergence tracking.

**Status:** Format defined. TENSION-001 written. Decay protocol operational (REFLECT emits pressure, human decides). Divergence tracking introduced. No automated detection yet — corpus must precede automation.

**The axis is not "better memory." It is: can the system detect when its own ontology is lying?**

### Phase C — Governance Engine *(not started)*

**What it is:** Enforcement of epistemic separation itself — not just "what is allowed" but "who can decide what is operational truth." This is Phase 4 (Policy Engine) reframed at its correct level.

**Prerequisites:** Phase A stable. Signal system generating real data (Phase B corpus exists). Policy without memory is bureaucracy; policy without constitutional authority is theater.

**The question it answers:** When `arch govern` enforces a rule, is that rule traceable to a deterministic source? Or has REFLECT's output contaminated the rule's origin?

### Phase D — Reflexive Closure *(not started)*

**What it is:** The system detects when its interpretation layer is starting to influence its authority layer — before it becomes structural. REFLECT influence tracking, human decision drift monitoring, semantic authority leakage detection.

**Prerequisites:** Phase C operational. Without governance enforcement, reflexive closure has nothing to protect.

**This phase does not exist in any other system.** It is what separates ARCH from a sophisticated retrieval + synthesis pipeline with governance theater on top.

### Phase P — Productization (Decoupling) *(NEW — immediate)*

**What it is:** Decoupling the ARCH CLI from this specific repository's protocol. Making the CLI "protocol-aware" (via schema) rather than "repo-aware."

**Status:** Strategic intent established. Core refactor required to move hardcoded paths and rules to configuration.

**The Goal:** Enable `arch init` in any repository, delivering a minimal starter protocol and immediate governance value in under 2 minutes.

---

### Deprioritized (not removed — downgraded from primary axis)

These were previously treated as core milestones. They are now supporting infrastructure:

- `arch ask` quality improvements — useful, not on the critical path. Retrieval quality does not protect epistemic integrity.
- LLM synthesis quality improvements — permitted zone, but not the constraint. Better synthesis with weak authority separation is more dangerous, not better.
- Feature velocity — not the metric. Epistemic integrity under use pressure is the metric.

---

### Original priority sequence (historical record)

1. ~~**`docs/IDENTITY.md`**~~ — shipped 2026-05-11
2. ~~**`arch ask`**~~ — **shipped 2026-05-11** — operational; not yet validated as compounding
3. ~~**Chronicle causal graph + signal arbitration**~~ — **shipped 2026-05-11** — signal hooks wired (TASK-228). Real graph data sparse.
4. **Cross-task pattern distillation** — still valid; now belongs to Phase B/D
5. **Governance Engine** — renamed from "Policy Engine"; reframed as Phase C

---

## Legend

| Status | Meaning |
|--------|---------|
| `DONE` | Operational — reduces real friction, verified by use, not just by existence |
| `IN PROGRESS` | Active task or ADR in flight |
| `PARTIAL` | Foundational work exists; key gaps remain |
| `NOT STARTED` | No task, ADR, or IDEA has begun execution |

---

## Phase 0 — Constitutional Authority *(formerly: Conceptual Consolidation)*

**Objective:** Freeze the invariants that prevent authority from leaking between layers. What ARCH is, what it is not, and — critically — which layer can decide what.

> **Core invariants frozen 2026-05-12:** REFLECT/GOVERN separation (IDENTITY.md §7), Deterministic Core Invariant, authority boundary (REFLECT may influence interpretation but may never determine state transitions), influence measurement requirement. The remaining open item: semantic stability — core concepts still drift across sessions. Second remaining item: `arch govern` / `arch analyze` command split not yet implemented — the boundary is constitutionally frozen but structurally leaky at the command surface (IDEA-govern-reflect-split.md).

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Identity definition frozen | `DONE` | [docs/IDENTITY.md](IDENTITY.md) — definition, scope, layers, compounding condition, rejection criteria |
| Operational model frozen (TASK / THINK / DO / REVIEW / RETRO / GUIDELINES / ADR) | `DONE` | [docs/GOVERNANCE.md](GOVERNANCE.md) |
| Semantic stability (no constant renaming of core concepts) | `PARTIAL` | — |
| `docs/IDENTITY.md` — unifying theory of what ARCH is across all layers | `DONE` | **Prerequisite for Phases 3–8.** [docs/IDENTITY.md](IDENTITY.md) — definition, scope boundaries, layer distinctions, compounding condition, rejection criteria, priority lock. |

---

## Phase 1 — Friction Reduction

**Objective:** Eliminate ceremonial work. The system should feel like an operational copilot, not a documentation burden.

> **Phase status:** **1.0.0 — closed 2026-05-18.** CLI surface unified (arch.sh eliminated; npm package `@valentinlineiro/arch` published). Refinement funnel enforced (TTL + admission gate). Tiered obligations enforced (XS/S Hansei triggered-only; L3 self-archive gate). Metrics Narrowing: 0% confidence context injection suppressed; Census budget recalibrated per ADR-022. Remaining items (Drift intelligence, Auto Context compounding) are not 1.0.0 blockers — they require real usage data before advancing beyond PARTIAL.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| CLI Unification (Intent-based verbs) | `DONE` | arch.sh collapsed to installer shim. `@valentinlineiro/arch@1.0.0` published to npm. `arch capture`, `arch review`, `arch task`, `arch govern`, `arch memory` surface is canonical. |
| Refinement Funnel Tightening | `DONE` | TTL enforcement (`ttlCycles` in arch.config.json), admission gate (executable candidates only get IDEA-*.md files; speculative → ROADMAP-IDEAS.md). [ADR-021](adr/ADR-021-refinement-ttl-and-admission.md), TASK-249 |
| Metrics Narrowing | `DONE` | 0% confidence context injection suppressed (threshold <0.1 in ContextInference). Census budget recalibrated to 1500 to reflect capture template reality. [ADR-022](adr/ADR-022-census-budget-recalibration.md), TASK-946 |
| Tiered Obligations | `DONE` | XS/S Hansei triggered-only; M/L mandatory. XS L3 self-archive gate (DeterministicACVerifier). [ADR-009](adr/ADR-009-deterministic-ac-verifier.md), TASK-934 |
| `arch capture` — intent capture with auto-generated task, ACs, complexity, context | `PARTIAL` | Pipeline implemented. **Not yet validated as Operational.** Friction reduction vs `arch task create` has not been measured in a clean-flow session. Treat as PARTIAL until that validation happens — do not promote by assumption. |
| Auto Context Engine — infer relevant files, commits, ADRs, guidelines per task | `PARTIAL` | Infrastructure complete (ContextIndex v5). Feedback loop fully closed 2026-05-11: `ExtractContextFeedback` parses `### Context Feedback` checkboxes on task completion; `FeedbackRepository` persists signals to `.arch/context-feedback.json`; `ContextInference` applies 0.1× boost to task-refs rated `off`. Both `arch task done` and `arch loop` paths capture feedback (TASK-226). Ranking superiority over human intuition not yet validated — feedback accumulation has just begun. **Implemented, not yet Compounding.** [TASK-217](archive/TASK-217.md), [TASK-218](archive/TASK-218.md), [TASK-220](archive/TASK-220.md), [TASK-226](tasks/TASK-226.md), [IDEA-roadmap-auto-context-engine](refinement/IDEA-roadmap-auto-context-engine.md) |
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
| Layer 4: Semantic Memory (conceptual relationships between entities) | `PARTIAL` | ContextIndex v5 + feedback loop fully closed 2026-05-11. `ContextInference.score()` reads `context-feedback.json` and reduces task-reference boost by 90% for `off`-rated tasks. Both interactive (`arch task done`) and automated (`arch loop`) paths now capture feedback. Not yet consistently superior to human judgment — signal corpus is empty; compounding begins with real use. [TASK-219](archive/TASK-219.md), [TASK-220](archive/TASK-220.md), [TASK-226](tasks/TASK-226.md) |
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

## Phase 4 — Governance Engine *(formerly: Policy Engine)*

**Objective:** Enforce epistemic separation itself. Not just "what is allowed" but "who can decide what is operational truth." Structural constraints become machine-enforced invariants anchored in deterministic, auditable rules.

> **Gated on:** Phase A stable (constitutional authority frozen), Phase B corpus exists (real TENSION data), `arch ask` operational (Phase 2). Policy without memory is automated bureaucracy. Policy without constitutional authority is theater. Do not open this phase until REFLECT/GOVERN separation is structurally enforced at the command surface, not only constitutionally documented.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Structural policies (forbidden deps, arch boundaries, naming invariants, mandatory tests) | `NOT STARTED` | [IDEA-roadmap-structural-policies](refinement/IDEA-roadmap-structural-policies.md) |
| AI-proposed policies — ARCH detects patterns → proposes → human approves | `NOT STARTED` | [IDEA-roadmap-ai-proposed-policies](refinement/IDEA-roadmap-ai-proposed-policies.md). **Constraint:** proposals must be tagged as `[REFLECT-SUGGESTS]` and require human approval before entering any enforcement rule. LLM-originated policies that become enforcement rules without explicit human promotion violate the Deterministic Core Invariant. |
| `arch govern` / `arch analyze` command split | `DONE` | TASK-230 — `arch govern` runs enforcement only (deterministic, no LLM); `arch analyze` runs analysis only (proposals, never enforcement authority). `arch govern` may trigger `arch analyze` as an explicit named side-effect — labeled as analysis, not enforcement. |

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
| Chronicle — Causal Graph + Signal Arbitration | `PARTIAL` | **Shipped 2026-05-11.** Two-layer epistemic architecture. **Graph layer** (`causal-graph.jsonl`, ADR-014): committed truth. 6 relation types, epistemic metadata, append-only corrections, belief synthesis (dominant/competing/superseded). **Signal layer** (`causal-signal.jsonl`, ADR-015): observed hypotheses from lifecycle events. Arbitration: cross-domain corroboration → inferred edge committed; contradiction → conflict record; expiry after 3 review cycles → stale. Two invariants: Query Isolation (signals invisible to queries), Arbitration Determinism (same input → same output). `arch causal add|show|weaken|invalidate|synthesize|arbitrate`. Signal generation wired (TASK-228): `arch task done` emits domain-causal signals on every completion; `arch govern` emits to Chronicle only on ANDON_HALT class events — normal execution path is intentionally opaque to Chronicle by constitutional design ([IDENTITY.md §8](IDENTITY.md)). [ADR-014](adr/ADR-014-causal-graph-schema.md), [ADR-015](adr/ADR-015-causal-signal-arbitration.md), [TASK-224](tasks/TASK-224.md), [TASK-225](tasks/TASK-225.md) |
| Planner / Historian / Reviewer / Conductor / Optimizer agents | `NOT STARTED` | [IDEA-roadmap-multiagent-runtime](refinement/IDEA-roadmap-multiagent-runtime.md) |

---

## Phase 8 — The Moat

**Objective:** Accumulate operational memory that is irreplaceable and epistemically stable. The competitive advantage is not the CLI and not raw accumulated knowledge — it is institutional knowledge that compounds while remaining protected from contamination by its own interpretation layer.

> **Revised definition (2026-05-12):** A moat requires two conditions, not one. (1) Knowledge that cannot be reconstructed outside the repo — this is the original condition, still unmet. (2) That knowledge must be protected from REFLECT contamination: inferences must remain traceable to deterministic sources, not gradually shaped by LLM suggestions that accumulated authority without explicit human grant. An ARCH that meets condition 1 but not condition 2 is a system that corrupts its own advantage over time. Both conditions must be met simultaneously.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Operational memory accumulation | `IN PROGRESS` | docs/archive/ (198 archived + 20 active tasks), docs/KAIZEN-LOG.md |
| Causal event graph (Chronicle) | `PARTIAL` | Two-layer architecture live: graph (committed truth) + signal (observed hypotheses). `arch ask` causal integration complete — scoring is path-conditioned on active beliefs. Backward loop closed: lifecycle events → signal → arbitration → graph mutation. Signal generation wired (TASK-228, 2026-05-12): `arch task done` emits on every completion; `arch govern` normal path emits nothing to Chronicle — scheduling decisions are Domain 2 events; govern error path emits ANDON_HALT class signals — Domain 3 events where control failure constitutes domain semantic rupture ([IDENTITY.md §8](IDENTITY.md)). Real graph data sparse — moat begins when consistent task closures produce corroborating signal pairs. |
| Cross-task pattern distillation | `NOT STARTED` | [IDEA-oracle-archive-distillation](refinement/IDEA-oracle-archive-distillation.md) |
| Ontological Tension Detection | `PARTIAL` | **Not a THINK enhancement. Epistemic infrastructure, closer to Chronicle than to summarization.** TENSION records capture category errors and boundary ambiguities *before* they are violated — with the specific future misuse argument named. Format defined: `docs/tensions/TEMPLATE.md`. First record written 2026-05-12: TENSION-001 (governance enforcement vs governance analysis). **Correct development order:** manual corpus first → pattern classification → heuristics → structured THINK emission (much later). Without corpus, automated detection produces eloquent paranoia. The key signal: every human correction of "system passed but ontology is wrong" is a TENSION record waiting to be written. [IDEA-architectural-tension-capture](refinement/IDEA-architectural-tension-capture.md), [TENSION-001](tensions/TENSION-001.md) |

---

## Phase D — Reflexive Closure *(not started — gated on Phase C)*

**Objective:** The system detects when its interpretation layer is starting to influence its authority layer before it becomes structural. This phase does not exist in any other system. It is what separates ARCH from a sophisticated retrieval + synthesis pipeline with governance theater on top.

> **Gated on:** Phase C operational. Without governance enforcement, reflexive closure has nothing to protect. Without real REFLECT/GOVERN separation at the command surface, measuring their interaction is premature.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| REFLECT influence tracking | `PARTIAL` | Divergence tracking protocol introduced in `docs/tensions/weak-signals.md` (2026-05-12). Every adjudication records REFLECT suggestion vs human decision. Low divergence rate over time is a warning signal, not success. No corpus yet — mechanism is in place, data accumulation begins with first real adjudication. |
| Human decision drift monitoring | `NOT STARTED` | Requires REFLECT influence corpus. Pattern: if REFLECT suggests X and human decides X at high rate without documented rationale for alignment, governance authority has drifted. Detection requires Chronicle edges linking REFLECT emissions to human decisions over time. |
| Semantic authority leakage detection | `NOT STARTED` | Structural analog of influence tracking: detect naming, command surface, or artifact class changes that implicitly grant REFLECT authority without a formal boundary decision. TENSION records are the current manual mechanism. Automated detection requires TENSION corpus + pattern analysis. |

---

## Phase 9 — Standalone Architecture (Productization)

**Objective:** Decouple the ARCH CLI from the internal repo protocol to enable universal adoption.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Configurable Protocol Schema (remove hardcoded paths/rules) | `NOT STARTED` | [IDEA-cli-protocol-decoupling](refinement/IDEA-cli-protocol-decoupling.md) |
| `arch init` — 2-minute project bootstrap | `NOT STARTED` | [IDEA-arch-init-ux](refinement/IDEA-arch-init-ux.md) |
| Lean Starter Protocol (minimal protocol corpus) | `PARTIAL` | `docs/ARCH-CORE.md`, `TASK-985` (Doc Consolidation) |
| `arch resume` — self-healing for common halts | `NOT STARTED` | [IDEA-arch-resume](refinement/IDEA-arch-resume.md) |
