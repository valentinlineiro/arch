# IDEA: Multiagent runtime — Planner, Historian, Reviewer, Conductor, Optimizer agents
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DEFERRED
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

### Decision
DEFERRED: Valid long-term direction. Gated on Phase C/D prerequisites (signal corpus, arch ask compounding). Re-evaluate when READY count drops below 5 or Phase B reaches 50%.
