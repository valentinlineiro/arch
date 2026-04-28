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

## Agent hierarchy (v0.4.0)

> **Note:** ARCH v0.4.0 moves from a flat file structure to a modular, directory-based model (e.g., `docs/tasks/`, `docs/guidelines/`) to ensure scalability and better context management.

```
                    THINK mode
            (System check + Refinement)
            Reads: SPRINT + archive/ + BACKLOG
            Writes: Ephemeral terminal report
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
       DO mode                      RETRO mode
   (Intent: Exec)                 (Sprint close)
   (Intent: Human)                (Pattern detect)
          │                             │
    SPRINT.md                       INBOX.md
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
    ├── GUIDELINES.md      ← Permanent rules (The project's DNA)
    ├── agents/
    │   ├── THINK.md       ← Conductor + Refine consolidated protocol
    │   └── DO.md          ← Exec + Human consolidated protocol
    └── adr/
        └── ADR-000-template.md
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

# 1. Check sprint status
./scripts/arch.sh status    # Shows READY / IN_PROGRESS / DONE counts
./scripts/arch.sh inbox     # Show weekly dashboard and pending refinement
./scripts/arch.sh next      # Suggests the next most relevant task

# 2. Manage tasks
./scripts/arch.sh task start TASK-001   # Mark a task as IN_PROGRESS
./scripts/arch.sh task done  TASK-001   # Mark a task as DONE and archive it

# 3. Verify system integrity
./scripts/arch.sh validate  # Structural validation (task format, required files)
./scripts/arch.sh review    # Deterministic check of guidelines, task formats, and drift

# Planned
# arch conduct   # Invokes THINK mode (coming soon)
# arch exec      # Invokes DO mode for next READY task (coming soon)
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

**v0.4.0 — Scalable Context & Modular Protocols.**
The methodology is supported by a deterministic CLI engine and modular repository structure.

---

## License

MIT — use it, fork it, build products on top of it.
