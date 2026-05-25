# ARCH

**Autonomous Routing and Context Hierarchy**

A Git-native operational protocol for human+AI collaborative work.

ARCH provides the missing layer between AI CLIs (Claude Code, Gemini CLI, Codex) and real work: a structured protocol for capturing, routing, executing, and improving tasks — with humans as decision-makers and AI as the execution layer.

**What ARCH is not:** a chat UI, a Jira replacement, a second brain, or an autonomous agent system. If a proposed use case doesn't require a git repo and a set of tasks to execute, it's outside ARCH.

---

## In practice

Sprint 1 — 72 hours, solo operator:
- **29 tasks** created, 16 completed
- **3 ADRs** written before implementation
- **1 architectural pivot** caught in refinement (Python → TypeScript)
- **3 kaizen improvements** → permanent rules in `GUIDELINES.md`
- **REVIEWER engine** shipped (deterministic validation, no IA overhead)

### The Architectural Git Log
ARCH encourages atomic, task-tagged commits that preserve the rationale of every change:

```text
d442d90 docs: Deprecate stale DISPATCH.md [TASK-074]
f73f467 refactor: remove redundant DONE.md and simplify archiving [TASK-076]
7e10389 chore: archive TASK-065 as DONE [TASK-065]
4fb15b2 [TASK-025] implementation of ACs: arch validate command
bf29462 [TASK-027] restructure CLI codebase to cli/src/{main,test}/ts
d9d41db chore: pivot CLI migration from Python to Node.js [TASK-027]
```

---

## Status

<!-- ARCH-REPORT:START -->
#### ARCH Materialized Status
**Generated:** 2026-05-25T16:20:21.823Z
**Sprint ID:** sprint/v1.0.0-improvements

| Status | Count |
| :--- | :--- |
| Ready | 22 |
| In Progress | 0 |
| Review | 0 |
| Blocked | 7 |
| Done (Archive) | 376 |

**Audit Score:** 100/100
<!-- ARCH-REPORT:END -->

## The problem

AI CLIs exist. Standards like `AGENTS.md` and `MCP` exist. What doesn't exist is a **method** for operating work with multiple AI agents across a whole organization — one that:

- Works with Claude Code, Gemini CLI, Codex, Aider, or any future CLI
- Minimizes token cost without sacrificing quality
- Keeps humans as decision-makers, not prompt-writers
- Applies to engineering, research, writing, operations — not just code
- Improves systematically over time (kaizen, not configuration)

ARCH is that method.

---

## Core principles

**1. Git is the operating system**
All state lives in git. No external databases, no SaaS lock-in.

**2. Context is a budget, not a default**
Every task declares exactly what context it needs. Cuts token cost ~75%.

**3. Humans propose, AI closes gaps**
Ideas come from humans. AI flags dependencies and surfaces patterns.

**4. Routing over monogamy**
Different tasks require different CLIs. Reasoning to Claude, large context to Gemini.

**5. Kaizen is structural**
Every sprint ends with a retrospective where AI proposes rule changes. The system gets smarter automatically.

---

## Epistemic architecture (v1.0.0)

Three layers, each with a distinct role:

```
  Existence layer          Activation layer         Signal layer
  ──────────────           ────────────────         ────────────
  causal-graph.jsonl  →→→  causalRelevance()   ←←   causal-signal.jsonl
  committed truth          path-conditioned         observed hypotheses
  (human + arbitrated)     scoring multiplier       (pending arbitration)
        ↑                                                  ↓
        └──────────────── arch causal arbitrate ───────────┘
                          cross-domain corroboration
                          → inferred edge committed
                          contradiction → conflict record
                          expiry → stale (auditable)
```

Two invariants enforced in code:
- **Query Isolation** — pending signals never influence scoring. Queries read only the committed graph.
- **Arbitration Determinism** — same signal set always produces the same mutations, regardless of insertion order.

---

## Repository structure

```
your-project/
├── AGENTS.md              ← AI entry point (symlinked to docs/AGENTS.md)
├── arch.config.json       ← Routing and path configuration
├── cli/                   ← Node.js/TS Clean Architecture CLI
├── .arch/
│   ├── causal-graph.jsonl ← Committed causal truth (append-only)
│   └── causal-signal.jsonl← Observed hypotheses pending arbitration
└── docs/
    ├── tasks/             ← Active tasks
    ├── archive/           ← Completed tasks (operational memory)
    ├── adr/               ← Architectural decisions (ADR-001–015)
    ├── guidelines/        ← Permanent rules
    ├── agents/
    │   ├── THINK.md       ← Refinement + pattern detection protocol
    │   └── DO.md          ← Execution protocol
    ├── IDENTITY.md        ← What ARCH is (frozen definition)
    ├── ROADMAP.md         ← Strategic state and phase tracking
    ├── KAIZEN-LOG.md      ← Accumulated improvements
    └── RETRO.md           ← Sprint retrospectives
```

---

## Task format (v0.4.0)

```markdown
## TASK-077: Automate push after successful arch check
**Meta:** P3 | S | READY | Focus:yes | 7-operations | local | scripts/arch.sh
**Depends:** none

### Acceptance Criteria
- [ ] Add a `--push` flag to `arch check` in `scripts/arch.sh`.
- [ ] If `--push` is present and review is OK, execute `git push`.
- [ ] Ensure `git push` is NOT executed if any review check fails.

### Definition of Done
- [ ] `arch check --push` works as expected.
- [ ] Manual verification of safety (no push on failure).
- [ ] `arch check` passes.
```

---

## CLI & Quick start

```bash
arch init --minimal
cd my-project

# Sprint management
arch govern                           # Enforcement tick: archive DONE, assign focus, check thresholds
arch govern inbox                     # Weekly dashboard and pending refinement
arch govern reflect                   # THINK analysis: INBOX, Kaizen, drift detection
arch govern report                    # Operational metrics report
arch govern compact-escalations       # Deduplicate escalations.jsonl
arch task next                        # Suggests next most relevant task
arch task rank                        # Rank READY tasks by priority and size
arch task start TASK-001              # Mark IN_PROGRESS
arch task done  TASK-001              # Archive as DONE
arch task promote my-idea             # Promote an IDEA to a TASK
arch task reprioritize                # Corpus-informed priority adjustment
arch task compress --all              # Compress archive to save Census budget
arch task loop                        # Autonomous task loop (agent mode)
arch task batch                       # Batch task operations
arch task drain                       # Drain task batch queue
arch task conduct                     # Conduct a batch session
arch task sandbox                     # Sandbox task execution
arch task mv TASK-001                 # Move task between states
arch task exec TASK-001               # Execute task in agent mode
arch task merge-resolve               # Auto-resolve trivial merge conflicts
arch task verify-acs TASK-001         # Run AC verification without closing
arch task validate TASK-001           # Validate task format
arch task lint                        # Lint all task files

# Corpus intelligence
arch memory ask "why did auth routing fail?"  # Semantic query over corpus
arch ask "pattern in SpecDrift tasks"          # Alias for memory ask
arch corpus audit                              # Deterministic corpus quality report
arch corpus audit --verbose                    # Full findings with INFO entries
arch audit .                                   # Alignment audit: ADRs vs git evidence
arch audit --public https://github.com/x/y    # Structural MRI for any public repo
arch analyze                                   # THINK analysis: surface Kaizen, detect drift
arch analyze influence                         # Epistemic influence report
arch causal                                    # Causal graph operations

# Lifecycle
arch review                           # Auditor queue: tasks needing human review
arch check                            # Full system review: format, drift, integrity
arch status                           # Session orientation: focus, alerts, alignment
arch resume TASK-001                  # Automate ANDON_HALT recovery
arch resume TASK-001                  # Automate ANDON_HALT recovery
arch capture                          # Capture decision or observation to corpus
arch explain TASK-001                 # Explain a task in corpus context
arch report                           # Operational report
arch reflect                          # THINK reflect analysis
arch inbox                            # View governance inbox
arch sentinel                         # Sentinel coverage check
arch index                            # Rebuild context index
arch init                             # Initialize ARCH in a repo
arch version                          # Show CLI version
arch status                           # High-level sprint and task progress
```

---

## Daily workflow

```bash
# 1. Start session — THINK mode (run by your AI agent)
#    Scans tasks, refines ideas, detects patterns
#    (invoke via your AI CLI — not a CLI command)

# 2. Start a task
arch task start TASK-032

# 3. Implement, then verify
arch check
#   ✔ System Review: OK
#
#   Drift
#     ✔ Commands
#     ✔ Version
#         v1.0.0
#     ✔ Paths

# 4. Done
arch task done TASK-077
```

---

## Status

**v1.0.0 — Operational.**
ARCH is a usable, self-governing operational framework for disciplined, git-native teams. The deterministic core is stable: `arch check` enforces structural integrity across 22+ checks, task lifecycle is fully operational, `arch ask` retrieval is conditioned on committed causal beliefs, and the CLI is published as `@valentinlineiro/arch` on npm.

The gap is no longer "can ARCH run daily work?" It can. The question now is whether repeated use produces observable compounding advantage — whether `arch ask` returns better results as the causal graph fills, and whether REFLECT proposals improve as the archive grows. That validation requires real operational time, not more features.

What ARCH is ready for now:
- internal engineering teams and early adopters who accept a git-as-OS operating model
- high-discipline repositories where auditability and human/AI authority separation matter more than convenience
- teams that want a structured protocol for human+AI collaboration without autonomous governance mutation

What it is not ready for yet:
- low-discipline or convenience-first teams
- a centralized multiagent runtime
- broad "plug-and-play" rollout without onboarding to the protocol

---

## License

MIT — use it, fork it, build products on top of it.
