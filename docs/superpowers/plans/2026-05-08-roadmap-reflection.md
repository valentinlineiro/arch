# Roadmap Reflection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reflect the strategic ARCH roadmap into `docs/ROADMAP.md` (8 phases, progress tables) and 12 IDEA files (4 DECIDED, 8 PENDING with rationale).

**Architecture:** Pure documentation work — no code changes. Three commits: ROADMAP.md, DECIDED IDEAs, PENDING IDEAs. Final verification via `arch review`.

**Tech Stack:** Markdown, ARCH IDEA format, git.

---

### Task 1: Write `docs/ROADMAP.md`

**Files:**
- Create: `docs/ROADMAP.md`

- [ ] **Step 1: Write the file**

Create `docs/ROADMAP.md` with the following exact content:

```markdown
# ROADMAP.md
<!-- ARCH Strategic Roadmap | v0.6.0 → 1.0.0 → 2.0 -->
<!-- Updated: 2026-05-08 -->

## Identity

> **ARCH is a git-native operational protocol for human+AI collaborative work.**

This definition is frozen. ARCH is not an autonomous AGI swarm, a no-code platform, a chat UI, a SaaS workspace, a Jira replacement, or a second brain.

## Fundamental Principle

> Each new layer must reduce net friction. If a proposed feature increases complexity without eliminating cognitive load, reject it.

## Legend

| Status | Meaning |
|--------|---------|
| `DONE` | Fully implemented, verified, and stable |
| `IN PROGRESS` | Active task or ADR in flight |
| `PARTIAL` | Foundational work exists; key gaps remain |
| `NOT STARTED` | No task, ADR, or IDEA has begun execution |

---

## Phase 0 — Conceptual Consolidation

**Objective:** Close the mental model. Freeze invariants: what ARCH is, what it is not, and the operational model that governs it.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Identity definition frozen | `PARTIAL` | [docs/PRINCIPLES.md](PRINCIPLES.md) |
| Operational model frozen (TASK / THINK / DO / REVIEW / RETRO / GUIDELINES / ADR) | `DONE` | [docs/GOVERNANCE.md](GOVERNANCE.md) |
| Semantic stability (no constant renaming of core concepts) | `PARTIAL` | — |

---

## Phase 1 — Friction Reduction

**Objective:** Eliminate ceremonial work. The system should feel like an operational copilot, not a documentation burden.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| `arch capture` — intent capture with auto-generated task, ACs, complexity, context | `IN PROGRESS` | [TASK-210](tasks/TASK-210.md), [IDEA-roadmap-arch-capture](refinement/IDEA-roadmap-arch-capture.md) |
| Auto Context Engine — infer relevant files, commits, ADRs, guidelines per task | `IN PROGRESS` | [TASK-210](tasks/TASK-210.md), [IDEA-roadmap-auto-context-engine](refinement/IDEA-roadmap-auto-context-engine.md) |
| Automatic entity linking — tasks↔commits, ADRs↔tasks, guidelines↔failures | `NOT STARTED` | [IDEA-roadmap-automatic-linking](refinement/IDEA-roadmap-automatic-linking.md) |
| Drift detection — orphan tasks, dead refs, unapplied ADRs, stale guidelines | `DONE` | [ADR-013](adr/ADR-013-two-tier-drift-detection.md), [TASK-215](archive/TASK-215.md), [IDEA-roadmap-drift-detection](refinement/IDEA-roadmap-drift-detection.md) |

---

## Phase 2 — Memory System

**Objective:** Move from documentation to operative memory. ARCH should understand, not just record.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Layer 1: Operational Memory (tasks, commits, retros, failures) | `PARTIAL` | docs/archive/ (193+ tasks), docs/RETRO.md |
| Layer 2: Decision Memory (ADRs, rationale, rejected alternatives) | `DONE` | docs/adr/ (13 ADRs) |
| Layer 3: Pattern Memory (bug classes, workflow failures, productivity patterns) | `PARTIAL` | [docs/PRINCIPLES.md](PRINCIPLES.md), [docs/KAIZEN-LOG.md](KAIZEN-LOG.md) |
| Layer 4: Semantic Memory (conceptual relationships between entities) | `PARTIAL` | [TASK-210](tasks/TASK-210.md) (ContextIndex) |
| `arch ask` — memory queries that produce causal patterns and recommendations | `NOT STARTED` | [IDEA-roadmap-memory-queries](refinement/IDEA-roadmap-memory-queries.md) |

---

## Phase 3 — Routing Engine

**Objective:** Separate intent from execution. ARCH decides model, cost, context, and depth — not the human.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Intelligent routing by task class, size, and provider | `DONE` | [ADR-011](adr/ADR-011-unified-provider-strategies.md), [ADR-013](adr/ADR-013-two-tier-drift-detection.md), [IDEA-roadmap-routing-engine](refinement/IDEA-roadmap-routing-engine.md) |

---

## Phase 4 — Policy Engine

**Objective:** Convert `arch review` into governance. Structural constraints become machine-enforced invariants.

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

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| THINK / DO agents | `DONE` | docs/agents/THINK.md, docs/agents/DO.md |
| Chronicle — Causal Event Graph | `PARTIAL` | [TASK-212](archive/TASK-212.md) (Phase 1 done) |
| Planner / Historian / Reviewer / Conductor / Optimizer agents | `NOT STARTED` | [IDEA-roadmap-multiagent-runtime](refinement/IDEA-roadmap-multiagent-runtime.md) |

---

## Phase 8 — The Moat

**Objective:** Accumulate operational memory that is irreplaceable. The competitive advantage is not the CLI — it is the institutional knowledge that compounds inside the repo.

| Feature | Status | Key Artifact |
|---------|--------|--------------|
| Operational memory accumulation | `IN PROGRESS` | docs/archive/ (193+ tasks), docs/KAIZEN-LOG.md |
| Causal event graph (Chronicle) | `PARTIAL` | [TASK-212](archive/TASK-212.md) |
| Cross-task pattern distillation | `NOT STARTED` | [IDEA-oracle-archive-distillation](refinement/IDEA-oracle-archive-distillation.md) |
```

- [ ] **Step 2: Commit**

```bash
git add docs/ROADMAP.md
git commit -m "docs: [TASK-216] add ROADMAP.md with 8-phase progress tables"
```

---

### Task 2: Write 4 DECIDED IDEA files

**Files:**
- Create: `docs/refinement/IDEA-roadmap-arch-capture.md`
- Create: `docs/refinement/IDEA-roadmap-auto-context-engine.md`
- Create: `docs/refinement/IDEA-roadmap-drift-detection.md`
- Create: `docs/refinement/IDEA-roadmap-routing-engine.md`

These are closed index records. They do not enter the THINK→BACKLOG flow.

- [ ] **Step 1: Write `docs/refinement/IDEA-roadmap-arch-capture.md`**

```markdown
# IDEA: arch capture — intent capture with auto-generated task scaffold
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DECIDED
**Meta:** P1 | M | claude-code | cli/src/main/ts/

## Problem
Creating a task requires manual authoring of TASK file, ACs, complexity estimate, dependencies, and context. This ceremony makes ARCH feel like a documentation burden rather than an operational copilot.

## Proposed solution
`arch capture "<intent>"` generates a complete TASK file: ACs, complexity, dependencies, context inference, and tags. The human reviews and promotes to READY.

## Rationale
This is the single feature that most changes how ARCH feels. Without it, ARCH is a documentation system. With it, ARCH is a copilot. The transition from "system of documentation" to "operational copilot" happens here.

## Dependencies
None.

## Estimated size
M

## Gaps

## Decision
PROMOTE → TASK-210
```

- [ ] **Step 2: Write `docs/refinement/IDEA-roadmap-auto-context-engine.md`**

```markdown
# IDEA: Auto Context Engine — infer relevant files, commits, ADRs, and guidelines per task
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DECIDED
**Meta:** P1 | M | claude-code | cli/src/main/ts/domain/

## Problem
Agents must manually construct context by loading docs wholesale, wasting tokens and missing relevant history. There is no mechanism to surface which files, ADRs, and guidelines are actually relevant to the task at hand.

## Proposed solution
ARCH infers context automatically before task execution: relevant files (from git history and imports), related commits, applicable ADRs, matching guidelines, and similar historical tasks. Context is injected into the task file as a `## Context Feedback` section before the agent begins.

## Rationale
This is the true technical core of Phase 1. Without auto-context, every agent session starts cold. With it, ARCH compounds institutional knowledge into every execution. The difference is between a tool and an infrastructure.

## Dependencies
arch capture (TASK-210).

## Estimated size
M

## Gaps

## Decision
PROMOTE → TASK-210
```

- [ ] **Step 3: Write `docs/refinement/IDEA-roadmap-drift-detection.md`**

```markdown
# IDEA: Drift detection — two-tier structural and semantic integrity checks
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DECIDED
**Meta:** P1 | M | claude-code | cli/src/main/ts/domain/services/drift-checker.ts

## Problem
ARCH accumulates structural debt silently: orphan tasks, dead references, unapplied ADRs, stale guidelines, contradictory rules. Without systematic detection, entropy grows undetected across sessions.

## Proposed solution
A two-tier drift checker integrated into `arch review`: Tier 1 checks structural invariants (task format, path integrity, dependency graph); Tier 2 checks semantic integrity (orphan tasks, dead context, unapplied ADRs, obsolete guidelines).

## Rationale
Organizational collapse happens when coordination surfaces lag reality. Drift detection prevents this by making entropy visible at zero cost — every session starts with a clean integrity report.

## Dependencies
None.

## Estimated size
M

## Gaps

## Decision
PROMOTE → ADR-013, TASK-215
```

- [ ] **Step 4: Write `docs/refinement/IDEA-roadmap-routing-engine.md`**

```markdown
# IDEA: Routing Engine — intelligent model and provider selection per task
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DECIDED
**Meta:** P1 | S | claude-code | arch.config.json, cli/src/main/ts/domain/services/provider-registry.ts

## Problem
Humans manually select models and providers per task. This creates inconsistency, cost inefficiency, and cognitive overhead. A small bugfix routed to an expensive reasoning model wastes money; an architecture decision routed to a cheap model produces poor output.

## Proposed solution
ARCH routes automatically by task class (code-generation, writing, reasoning) and size (XS, S, M, L), resolving to the optimal provider/model pair from a unified `strategies` configuration. Fallback chains ensure execution continues when primary providers are unavailable.

## Rationale
This converts ARCH into a multi-model runtime. The human declares intent; ARCH decides execution strategy. Separation of intent from execution is what distinguishes a protocol from a wrapper.

## Dependencies
None.

## Estimated size
S

## Gaps

## Decision
PROMOTE → ADR-011, ADR-013
```

- [ ] **Step 5: Commit**

```bash
git add docs/refinement/IDEA-roadmap-arch-capture.md \
        docs/refinement/IDEA-roadmap-auto-context-engine.md \
        docs/refinement/IDEA-roadmap-drift-detection.md \
        docs/refinement/IDEA-roadmap-routing-engine.md
git commit -m "docs: [TASK-216] add 4 DECIDED roadmap IDEA files"
```

---

### Task 3: Write PENDING IDEA files — set A (automatic linking, memory queries, structural policies, AI-proposed policies)

**Files:**
- Create: `docs/refinement/IDEA-roadmap-automatic-linking.md`
- Create: `docs/refinement/IDEA-roadmap-memory-queries.md`
- Create: `docs/refinement/IDEA-roadmap-structural-policies.md`
- Create: `docs/refinement/IDEA-roadmap-ai-proposed-policies.md`

- [ ] **Step 1: Write `docs/refinement/IDEA-roadmap-automatic-linking.md`**

```markdown
# IDEA: Automatic entity linking — tasks, commits, ADRs, and guidelines auto-connect
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DRAFT
**Meta:** P1 | M | claude-code | cli/src/main/ts/domain/

## Problem
Relationships between ARCH entities exist implicitly in commit messages, task references, and ADR citations — but are never materialized. An agent wanting to know "which commits implemented TASK-102?" or "which tasks cite ADR-004?" must grep manually, and the answer is never guaranteed complete.

## Proposed solution
ARCH automatically links entities at write time and index time:
- Tasks ↔ commits (via commit message TASK-ID refs)
- ADRs ↔ tasks (via task `Depends` and ADR references in task context)
- Guidelines ↔ failures (via retro and KAIZEN-LOG entries)
- Retros ↔ patterns (via recurring failure signatures)

Links are stored in the context index (from TASK-210) and surfaced in task context feedback and `arch ask` queries.

## Rationale
If the user has to link entities manually, the system loses. Automatic linking is what turns ARCH from a folder of markdown into a connected knowledge graph. Every manual link that ARCH fails to create is friction that accumulates into abandonment.

## Dependencies
TASK-210 (Auto Context Engine / ContextIndex).

## Estimated size
M

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
```

- [ ] **Step 2: Write `docs/refinement/IDEA-roadmap-memory-queries.md`**

```markdown
# IDEA: arch ask — memory queries over the full ARCH operational corpus
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DRAFT
**Meta:** P1 | L | claude-code | cli/src/main/ts/

## Problem
ARCH accumulates operational memory across hundreds of tasks, retros, ADRs, and guidelines — but this memory is not queryable. An agent or human wanting to know "why do auth tasks keep failing?" must manually read through archives. Institutional knowledge exists but is not accessible.

## Proposed solution
`arch ask "<question>"` analyzes the full ARCH corpus (tasks, retros, commits, ADRs, guidelines, KAIZEN-LOG) and produces: causal patterns, recurring failure signatures, and actionable recommendations. Example output:

```
arch ask "why do auth tasks keep failing?"

→ Pattern detected (7 occurrences): auth tasks fail REVIEW when input validation
  is missing at the service boundary.

→ Related tasks: TASK-031, TASK-044, TASK-067, TASK-089, TASK-112, TASK-134, TASK-156
→ Related guideline: GUIDELINE-012 (validation before persistence)
→ Suggested action: Add AC template for auth tasks requiring explicit validation step.
```

## Rationale
This is where ARCH starts to feel like an OS rather than a task manager. The moat is not the CLI — it is the accumulated operational memory. `arch ask` is the interface that makes that memory actionable. Without it, the memory exists but cannot be accessed. With it, ARCH compounds every session's knowledge into future sessions.

## Related IDEAs
- [IDEA-rag-context-retrieval.md](IDEA-rag-context-retrieval.md) — RAG infrastructure that could power this
- [IDEA-oracle-archive-distillation.md](IDEA-oracle-archive-distillation.md) — archive distillation approach
- [IDEA-institutional-memory-document.md](IDEA-institutional-memory-document.md) — related memory surface

## Dependencies
TASK-210 (ContextIndex), IDEA-roadmap-automatic-linking (for relationship traversal).

## Estimated size
L

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
```

- [ ] **Step 3: Write `docs/refinement/IDEA-roadmap-structural-policies.md`**

```markdown
# IDEA: Structural policies — machine-enforced architectural boundaries in arch review
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DRAFT
**Meta:** P2 | M | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, arch.config.json

## Problem
Architectural constraints (forbidden dependencies, naming conventions, mandatory tests for core modules, module boundary rules) are stated in guidelines but not enforced. A convention that can be skipped under velocity pressure will be skipped. Guidelines alone are not governance.

## Proposed solution
Define structural policies in `arch.config.json` as declarative rules checked by `arch review`:

```json
"policies": {
  "forbiddenDependencies": [
    { "from": "domain/", "to": "infrastructure/", "reason": "domain must not depend on infra" }
  ],
  "requiredTestCoverage": [
    { "path": "domain/services/", "requiresTest": true }
  ],
  "namingInvariants": [
    { "pattern": "domain/models/*.ts", "mustMatch": "^[a-z-]+\\.ts$" }
  ],
  "adrRequiredFor": ["domain/services/", "arch.config.json"]
}
```

Each policy violation is a `arch review` WARN or ERR, with the same severity semantics as existing drift checks.

## Rationale
P-003 states: "Any intended gate must produce a non-zero exit from arch review or a pre-commit hook. A gate enforced only by convention will eventually be skipped under velocity pressure." Structural policies extend this principle from task format to architectural integrity. This is the difference between ARCH as a workflow tool and ARCH as a governance layer.

## Related IDEAs
- [IDEA-formal-protocol-invariants.md](IDEA-formal-protocol-invariants.md) — closely related; machine-provable guarantees

## Dependencies
ADR-013 (two-tier drift detection framework).

## Estimated size
M

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
```

- [ ] **Step 4: Write `docs/refinement/IDEA-roadmap-ai-proposed-policies.md`**

```markdown
# IDEA: AI-proposed policies — ARCH detects patterns and proposes guidelines for human approval
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DRAFT
**Meta:** P2 | M | claude-code | docs/refinement/, docs/guidelines/

## Problem
Guidelines are written reactively — after a failure has already occurred and been codified in KAIZEN-LOG. ARCH has enough operational history to detect recurring failure patterns proactively, but there is no mechanism to surface them as proposed rules.

## Proposed solution
During THINK mode, ARCH analyzes retros, KAIZEN-LOG, and task failure patterns. When it detects a recurring failure class (e.g., 7 auth tasks failed REVIEW for the same reason), it generates a proposed guideline and places it in `docs/refinement/` as an IDEA with `Source: AI-pattern-detection`:

```
Detected: 7 auth tasks failed REVIEW due to missing input validation at service boundary.
Suggested guideline: Validate auth payload schema before persistence.
Proposed as: IDEA-ai-policy-auth-validation-boundary.md
```

The AI never imposes rules. It proposes. The human reviews the IDEA and decides to PROMOTE → GUIDELINE or REJECT. This maintains full human control while enabling compounding learning.

## Rationale
The goal is compounding governance — the system learns from failures and proposes structural responses. Human control is preserved: the AI detects, proposes, and explains; the human decides. This is the operational definition of "human+AI collaborative work" applied to the governance layer itself.

## Related IDEAs
- [IDEA-do-step-registry-for-kaizen.md](IDEA-do-step-registry-for-kaizen.md) — related Kaizen automation surface

## Dependencies
IDEA-roadmap-memory-queries (pattern analysis infrastructure).

## Estimated size
M

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
```

- [ ] **Step 5: Commit**

```bash
git add docs/refinement/IDEA-roadmap-automatic-linking.md \
        docs/refinement/IDEA-roadmap-memory-queries.md \
        docs/refinement/IDEA-roadmap-structural-policies.md \
        docs/refinement/IDEA-roadmap-ai-proposed-policies.md
git commit -m "docs: [TASK-216] add 4 PENDING roadmap IDEA files (linking, memory queries, policies)"
```

---

### Task 4: Write PENDING IDEA files — set B (operational load, adaptive planning, domain packs, multiagent runtime)

**Files:**
- Create: `docs/refinement/IDEA-roadmap-operational-load.md`
- Create: `docs/refinement/IDEA-roadmap-adaptive-planning.md`
- Create: `docs/refinement/IDEA-roadmap-domain-packs.md`
- Create: `docs/refinement/IDEA-roadmap-multiagent-runtime.md`

- [ ] **Step 1: Write `docs/refinement/IDEA-roadmap-operational-load.md`**

```markdown
# IDEA: Operational load tracking — model cognitive load, WIP, fatigue, and rework
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DRAFT
**Meta:** P3 | M | claude-code | docs/METRICS.md, cli/src/main/ts/

## Problem
ARCH models tasks as units of work but ignores the human reality of cognitive load. WIP accumulation, context-switching cost, fatigue cycles, and rework are invisible to the system. Productivity is treated as linear throughput when it is not.

## Proposed solution
Extend METRICS.md and task metadata to track operational load signals:
- WIP count and trend (tasks simultaneously IN_PROGRESS)
- Cognitive cost per task (derived from size × class × context switches)
- Rework rate (tasks that hit REVIEW_FAIL or required re-opening)
- Recovery cycles (time between high-load sessions and next productive session)

`arch review` warns when WIP exceeds a configured threshold. THINK mode incorporates load metrics into sprint replenishment recommendations.

## Rationale
Productivity is not throughput. A system that pushes more tasks into IN_PROGRESS when WIP is already high will produce rework, not output. Modeling operational load turns ARCH from a task tracker into a sustainable work system — necessary for household, personal, and startup use cases where energy is the real constraint.

## Related IDEAs
- [IDEA-mura-turns-per-size-metric.md](IDEA-mura-turns-per-size-metric.md) — related efficiency metric

## Dependencies
None.

## Estimated size
M

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
```

- [ ] **Step 2: Write `docs/refinement/IDEA-roadmap-adaptive-planning.md`**

```markdown
# IDEA: Adaptive planning — task states that model energy, context, and cognitive cost
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DRAFT
**Meta:** P3 | S | claude-code | docs/TASK-FORMAT.md, docs/guidelines/

## Problem
ARCH task statuses (READY, IN_PROGRESS, DONE, BLOCKED) model pipeline state but not human state. A task can be technically READY but practically unreachable because the operator lacks the cognitive bandwidth, context, or energy for it right now. This mismatch causes poor sprint planning and frustration.

## Proposed solution
Extend the task status vocabulary with optional human-state qualifiers:

- `READY/high-cost` — technically ready but requires deep focus (not suitable for fragmented time)
- `READY/context-heavy` — requires loading significant prior context before starting
- `BLOCKED/energy` — blocked not by technical dependency but by operator capacity
- `READY/maintenance` — low cognitive cost, suitable for low-energy sessions

These are advisory states, not workflow gates. `arch next` incorporates them when suggesting the next task, optionally accepting a `--energy low|medium|high` flag.

## Rationale
Sustainable systems model the constraints of their operators. For personal, household, and startup use cases — where the same person writes code, manages operations, and handles life — energy is a first-class constraint. Ignoring it produces plans that look good on paper and fail in practice.

## Related IDEAs
- [IDEA-context-control.md](IDEA-context-control.md) — context budget awareness
- [IDEA-cost-aware-protocol.md](IDEA-cost-aware-protocol.md) — cost-aware task ordering

## Dependencies
IDEA-roadmap-operational-load.

## Estimated size
S

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
```

- [ ] **Step 3: Write `docs/refinement/IDEA-roadmap-domain-packs.md`**

```markdown
# IDEA: Domain packs — protocol extensions for software, startup, household, and personal use
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DRAFT
**Meta:** P3 | XL | claude-code | docs/guidelines/, arch.config.json

## Problem
ARCH's current protocol is implicitly a software engineering system. Its task formats, AC patterns, review criteria, and guidelines are all tuned for code. Applying ARCH to other domains (managing a startup, running a household, personal development) requires manual protocol adaptation that is currently undocumented and unsupported.

## Proposed solution
Define domain packs as composable protocol extensions. Each pack provides: domain-specific task templates, AC patterns, guideline sets, and review criteria. A pack is activated in `arch.config.json`:

```json
"domains": ["software", "startup"]
```

**Software pack** (current implicit default): code tasks, test ACs, ADR requirements for arch changes.

**Startup pack**: strategy tasks, hiring decisions, sales pipeline, roadmap operations. AC patterns focus on outcomes (signed contracts, hired candidates) rather than code.

**Household pack**: inventory, maintenance schedules, recurring tasks, shopping prediction, shared coordination. Tasks have recurrence fields and coordination surfaces.

**Personal pack** (hardest): reflection cycles, goal tracking, energy rhythms, recovery modeling, adaptive planning. Requires the temporal/energy model (Phase 5) as a prerequisite.

## Rationale
The moat is not vertical (deeper software tooling) — it is horizontal (ARCH as the operational layer for all human+AI work). Domain packs are the mechanism for horizontal expansion. The core protocol stays minimal; domain-specific intelligence lives in packs. This prevents ARCH from becoming a bloated monolith while enabling universal applicability. Important constraint: personal pack must not become "Jira for humans" — it must model rhythms and recovery, not just throughput.

## Related IDEAs
- [IDEA-separate-arch-core-from-content.md](IDEA-separate-arch-core-from-content.md) — core/content separation prerequisite
- [IDEA-open-standard-portability.md](IDEA-open-standard-portability.md) — protocol portability
- [IDEA-multi-repo-arch.md](IDEA-multi-repo-arch.md) — multi-repo coordination

## Dependencies
IDEA-roadmap-operational-load (required for personal pack), IDEA-separate-arch-core-from-content.

## Estimated size
XL

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
```

- [ ] **Step 4: Write `docs/refinement/IDEA-roadmap-multiagent-runtime.md`**

```markdown
# IDEA: Multiagent runtime — Planner, Historian, Reviewer, Conductor, Optimizer agents
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DRAFT
**Meta:** P3 | XL | claude-code | docs/agents/, cli/src/main/ts/

## Problem
ARCH's current agent model is two-mode (THINK / DO). Complex tasks — decomposition, memory traversal, parallel execution, policy enforcement, pattern optimization — are handled by a single monolithic agent session. This limits parallelism, increases context bloat, and conflates responsibilities that benefit from specialization.

## Proposed solution
A formal multiagent layer with five specialized agents, built only after memory (Phase 2), routing (Phase 3), and policies (Phase 4) are in place:

**Planner** — decomposes intent into task graphs. Input: human intent. Output: ordered task set with dependencies.

**Historian** — manages memory traversal. Input: query or task context. Output: relevant history, patterns, prior decisions.

**Reviewer** — applies structural and semantic policies. Input: completed task diff. Output: PASS / FAIL with citations.

**Conductor** — orchestrates multi-task workflows. Input: task graph. Output: execution schedule, parallelism decisions, agent dispatch.

**Optimizer** — detects inefficiency patterns. Input: metrics, retros, task history. Output: proposed guidelines, process changes.

Each agent is ephemeral (stateless, dispatched per operation) and communicates through the ARCH repository state — not through direct message passing. The repository is the shared memory.

## Rationale
The prerequisite ordering is intentional and non-negotiable. Agents without memory repeat work. Agents without routing waste cost. Agents without policies drift. Building the multiagent layer before Phases 2–4 produces an impressive demo that collapses under real workload. The correct sequence: stabilize memory → enforce policies → formalize agents.

## Related IDEAs
- [IDEA-parallel-tasks.md](IDEA-parallel-tasks.md) — parallelism model
- [IDEA-handle-parallelism.md](IDEA-handle-parallelism.md) — concurrency handling
- [IDEA-loop-load-balancing.md](IDEA-loop-load-balancing.md) — loop-mode load distribution

## Dependencies
IDEA-roadmap-memory-queries, IDEA-roadmap-structural-policies, IDEA-roadmap-routing-engine (DONE).

## Estimated size
XL

## Gaps

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
```

- [ ] **Step 5: Commit**

```bash
git add docs/refinement/IDEA-roadmap-operational-load.md \
        docs/refinement/IDEA-roadmap-adaptive-planning.md \
        docs/refinement/IDEA-roadmap-domain-packs.md \
        docs/refinement/IDEA-roadmap-multiagent-runtime.md
git commit -m "docs: [TASK-216] add 4 PENDING roadmap IDEA files (load, planning, domain packs, multiagent)"
```

---

### Task 5: Verify and archive

**Files:**
- Modify: `docs/tasks/TASK-216.md` (mark DONE, check ACs)
- Move: `docs/tasks/TASK-216.md` → `docs/archive/TASK-216.md`

- [ ] **Step 1: Run `arch review`**

```bash
arch review
```

Expected: no new ERR. The `HanseiPresent` and existing warnings are pre-existing and not introduced by this task.

- [ ] **Step 2: Update TASK-216 ACs and archive**

In `docs/tasks/TASK-216.md`, mark all ACs checked and status DONE:

```
**Meta:** P1 | S | DONE | Focus:yes | 3-writing | claude-code | docs/ROADMAP.md docs/refinement/
```

Check all AC boxes:
```
- [x] `docs/ROADMAP.md` exists with identity statement, fundamental principle, legend, and 8 phase sections each containing a progress table → file: `docs/ROADMAP.md`
- [x] 4 DECIDED IDEAs exist in `docs/refinement/` pointing to their existing task/ADR → files: `IDEA-roadmap-arch-capture.md`, `IDEA-roadmap-auto-context-engine.md`, `IDEA-roadmap-drift-detection.md`, `IDEA-roadmap-routing-engine.md`
- [x] 8 PENDING IDEAs exist with roadmap rationale pre-filled and blank Decision section → files: `IDEA-roadmap-automatic-linking.md`, `IDEA-roadmap-memory-queries.md`, `IDEA-roadmap-structural-policies.md`, `IDEA-roadmap-ai-proposed-policies.md`, `IDEA-roadmap-operational-load.md`, `IDEA-roadmap-adaptive-planning.md`, `IDEA-roadmap-domain-packs.md`, `IDEA-roadmap-multiagent-runtime.md`
- [x] `arch review` passes → command: `arch review`
```

Add Hansei section at the bottom:

```markdown
## Hansei
The roadmap reflection converts an informal strategic vision into a navigable artifact within ARCH's own conventions. The key design decision — DECIDED IDEAs as closed index records rather than active proposals — prevents the backlog from being polluted with work already in flight while still giving ROADMAP.md a complete, linked index of all features. The PENDING IDEAs include the full strategic rationale, which means a future THINK session can evaluate them without needing to reconstruct context from scratch.
```

Move the file to archive:
```bash
mv docs/tasks/TASK-216.md docs/archive/TASK-216.md
```

- [ ] **Step 3: Final commit**

```bash
git add docs/archive/TASK-216.md
git commit -m "chore: [TASK-216] archive — all ACs verified, arch review passes"
```
