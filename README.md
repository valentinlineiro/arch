# ARCH

**Autonomous Routing and Context Hierarchy**

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
75b7178 chore: complete TASK-026 — Implementation of ARCH v0.2 [TASK-026]
2f91fe1 [TASK-026] implementation of ARCH v0.2: consolidated THINK/DO modes
4fb15b2 [TASK-025] implementation of ACs: arch validate command
163b43d refactor: redefine TASK-012 as deterministic CLI engine [TASK-012]
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

## Agent hierarchy (v0.2)

```
                    THINK mode
            (System check + Refinement)
            Reads: SPRINT + DONE + BACKLOG
            Writes: Ephemeral terminal report
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
       DO mode                      RETRO mode
   (Intent: Exec)                 (Sprint close)
   (Intent: Human)                (Pattern detect)
          │                             │
    SPRINT.md                       DONE.md
    ◄── status                      ──► GUIDELINES.md
    ◄── intent                      (Human approves)
```

---

## Repository structure

```
your-project/
├── AGENTS.md              ← AI entry point
├── arch.config.json       ← Routing and path configuration
├── cli/                   ← Node.js/TS Clean Architecture implementation
└── docs/
    ├── SPRINT.md          ← Active sprint tasks (Single Source of Truth)
    ├── BACKLOG.md         ← All tasks and IDEAs
    ├── DONE.md            ← Completed tasks with Iterations count
    ├── GUIDELINES.md      ← Permanent rules (The project's DNA)
    ├── agents/
    │   ├── THINK.md       ← Conductor + Refine consolidated protocol
    │   └── DO.md          ← Exec + Human consolidated protocol
    └── adr/
        └── ADR-000-template.md
```

---

## Task format (v0.2)

```markdown
## TASK-027: CLI Migration
**Meta:** P0 | L | DONE | Sprint 1 | 2-code-generation | claude-code | cli/, package.json
**Depends:** TASK-024

### Acceptance Criteria
- [x] Node.js project initialized with TypeScript.
- [x] Clean Architecture layers established.
- [x] Bundle process (tsup) created for zero-dep redistribution.

### Definition of Done
- [x] 'arch' command points to the new implementation.
- [x] PR approved.
```

---

## CLI & Quick start

```bash
npx arch-init my-project
cd my-project

# 1. Start a session
arch conduct   # Invokes THINK mode

# 2. Execute a task
arch exec      # Invokes DO mode for the next READY task

# 3. Verify system integrity
arch review    # Deterministic check of guidelines and task formats
```

---

## Status

**v0.2 — Clean Architecture & Automated Validation.**
The methodology is supported by a deterministic CLI engine.

---

## License

MIT — use it, fork it, build products on top of it.
