# ARCH

**Autonomous Routing and Context Hierarchy**

A Git-native operational protocol for human+AI collaborative work.

A methodology for running work with AI. Not just code — entire companies.

ARCH is an open framework that sits on top of `AGENTS.md`, `MCP`, and any AI CLI. It provides the missing layer: *how* to structure, route, and improve work across AI agents without losing human control, burning through context budgets, or locking into a single provider.

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

## Epistemic architecture (v0.6.0)

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
## TASK-077: Automate push after successful arch review
**Meta:** P3 | S | READY | Focus:yes | 7-operations | local | scripts/arch.sh
**Depends:** none

### Acceptance Criteria
- [ ] Add a `--push` flag to `arch review` in `scripts/arch.sh`.
- [ ] If `--push` is present and review is OK, execute `git push`.
- [ ] Ensure `git push` is NOT executed if any review check fails.

### Definition of Done
- [ ] `arch review --push` works as expected.
- [ ] Manual verification of safety (no push on failure).
- [ ] `arch review` passes.
```

---

## CLI & Quick start

```bash
npx arch-init my-project
cd my-project

# Sprint management
arch inbox                            # Weekly dashboard and pending refinement
arch task next                        # Suggests next most relevant task
arch task rank                        # Rank READY tasks by priority and size
arch task start TASK-001              # Mark IN_PROGRESS
arch task done  TASK-001              # Archive as DONE
arch task promote my-idea             # Promote an IDEA to a TASK

# Memory queries
arch ask "why did auth routing keep failing?"
# → query class, cause groups, ranked matches with causal context, entity refs

# Causal graph
arch causal add TASK-220 caused_by TASK-184 --note "routing debt"
arch causal add TASK-220 implements ADR-011 --confidence asserted
arch causal show TASK-220             # Active edges for entity
arch causal show TASK-220 --all       # Full history including weakened/invalidated
arch causal synthesize TASK-220       # Dominant belief + competing interpretations + superseded
arch causal weaken <edge-id>          # Downgrade belief with new evidence
arch causal invalidate <edge-id>      # Contradict — kept for audit, excluded from active queries
arch causal arbitrate                 # Consume pending signals → apply/conflict/expire

# Integrity
arch validate                         # Structural validation
arch review                           # Drift detection, task format, integrity checks
arch merge-resolve                    # Auto-resolve trivial merge conflicts
```

---

## Daily workflow

```bash
# 1. Start session — THINK mode (run by your AI agent)
#    Scans tasks, refines ideas, detects patterns
#    (invoke via your AI CLI — not a CLI command)

# 2. Start a task
./scripts/arch.sh task start TASK-032

# 3. Implement, then verify
./scripts/arch.sh review
#   ✔ System Review: OK
#
#   Drift
#     ✔ Commands
#     ✔ Version
#         v0.4.0
#     ✔ Paths

# 4. Done
./scripts/arch.sh task done TASK-077
```

---

## Status

**v0.6.0 — Causal Memory + Conditioned Retrieval.**
The system now has a closed epistemic loop: `arch ask` retrieval is conditioned on active causal beliefs, the causal graph is revisable via append-only corrections, and a signal arbitration layer closes the backward loop from lifecycle events to graph mutation.

---

## License

MIT — use it, fork it, build products on top of it.
