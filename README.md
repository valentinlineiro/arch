# ARCH

**Autonomous Routing and Context Hierarchy**

A methodology for running work with AI. Not just code — entire companies.

ARCH is an open framework that sits on top of `AGENTS.md`, `MCP`, and any AI CLI. It provides the missing layer: *how* to structure, route, and improve work across AI agents without losing human control, burning through context budgets, or locking into a single provider.

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

## What the name means

| Letter | Word | Role in the framework |
|--------|------|-----------------------|
| **A** | Autonomous | Agents operate without constant human supervision |
| **R** | Routing | Every task is matched to the right CLI by class and cost |
| **C** | Context | Each agent reads only what it needs — no more |
| **H** | Hierarchy | CONDUCTOR → agents → tasks — clear chain of delegation |

---

## Core principles

**1. Git is the operating system**
All state lives in git. No external databases, no SaaS lock-in. A new agent session or a new team member starts by reading `docs/` — nothing else required.

**2. Context is a budget, not a default**
Every task declares exactly what context it needs. Agents read only that. No full-repo scans unless explicitly required. Cuts token cost ~75%.

**3. Humans propose, AI closes gaps**
Ideas come from humans. AI's role in planning is to identify what's missing, flag dependencies, and surface patterns from history — not to generate roadmaps.

**4. Routing over monogamy**
Different tasks require different CLIs. ARCH routes by task class: reasoning to Claude, large context to Gemini, boilerplate to Codex, repetition to local models.

**5. Kaizen is structural, not optional**
Every sprint ends with a retrospective where AI detects patterns and proposes rule changes. Humans decide what becomes permanent. The system gets smarter without manual effort.

---

## Agent hierarchy

```
                    CONDUCTOR
                    (session start / checkpoint)
                    Reads: SPRINT + BACKLOG + DONE + RETRO
                    Writes: DISPATCH.md — what needs attention
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       REFINE           EXEC          RETRO
   (idea → task)   (task → PR)   (sprint → rules)
          │              │              │
  REFINEMENT.md    SPRINT.md       DONE.md
  ◄── gaps         ◄── status      ◄── patterns
  ◄── kaizen            │          ──► GUIDELINES.md
          │              ▼             (human approves)
          ▼          BACKLOG.md
     SPRINT.md
```

The CONDUCTOR is the only agent that sees the full picture.
It doesn't execute — it routes. Every other agent reads only
what its task declares in `Context-budget`.

---

## Repository structure

```
your-project/
├── AGENTS.md              ← Symlink → docs/AGENTS.md
├── CLAUDE.md              ← Symlink → docs/AGENTS.md
├── GEMINI.md              ← Symlink → docs/AGENTS.md
└── docs/
    ├── AGENTS.md          ← AI entry point (AGENTS.md standard compatible)
    ├── BACKLOG.md         ← All tasks, single source of truth
    ├── SPRINT.md          ← Active sprint tasks
    ├── DONE.md            ← Last 10 completed tasks (rolling window)
    ├── DISPATCH.md        ← Current system state (written by CONDUCTOR)
    ├── REFINEMENT.md      ← Ideas being refined before entering backlog
    ├── RETRO.md           ← Sprint retrospectives + detected patterns
    ├── GUIDELINES.md      ← Permanent rules (human-approved only)
    ├── ROUTING.md         ← Which CLI for which task type
    ├── agents/
    │   ├── CONDUCTOR.md   ← Meta-agent: diagnoses system, writes DISPATCH
    │   ├── EXEC.md        ← Execution protocol (~200 tokens)
    │   ├── REFINE.md      ← Refinement protocol (~300 tokens)
    │   └── RETRO.md       ← Retrospective protocol (~200 tokens)
    └── adr/
        └── ADR-000-template.md
```

---

## Task format

Every task is a self-contained unit of work with its own context budget:

```markdown
## TASK-042
**Meta:** P0 | M | READY | Sprint 3
**Class:** 1-code-reasoning
**CLI:** claude-code
**CLI-reason:** architectural decision with trade-offs
**Context-budget:** agents/EXEC.md + this task + src/auth/
**Depends:** TASK-039 (merged)
**ADR:** ADR-003 — no need to re-read, decision is final

### Acceptance Criteria
- [ ] POST /auth/login → {access_token, refresh_token}
- [ ] RS256 signature, refresh rotation
- [ ] Tests: happy path + expired token

### Definition of Done
- [ ] PR approved by human
- [ ] CI green
- [ ] /docs/api.md updated
```

---

## Task classes and CLI routing

```
CLASS                  EXAMPLES                   DEFAULT CLI
────────────────────────────────────────────────────────────────
1-code-reasoning       Architecture, ADRs,        Claude Code
                       complex debugging

2-code-generation      Boilerplate, CRUD,         Codex / Codestral
                       standard endpoints

3-code-context         Cross-repo refactors,      Gemini CLI
                       large codebase analysis

4-code-repetitive      Automation scripts,        Aider + local model
                       recurring transforms

5-research             Market analysis,           Perplexity / Gemini
                       technical specs, docs

6-writing              Technical docs, ADRs,      Claude
                       proposals, reports

7-operations           ETL, integrations,         Local + n8n
                       data pipelines

8-strategy             Trade-offs, planning,      Claude Opus / o3
                       retrospectives
```

---

## Context budget by mode

```
MODE          REQUIRED FILES                         MAX TOKENS
───────────────────────────────────────────────────────────────
Conductor     agents/CONDUCTOR.md + 4 state files   ~2,500
Execution     agents/EXEC.md + task                 ~1,500
Refinement    agents/REFINE.md + draft idea         ~2,000
Retrospective agents/RETRO.md + DONE.md             ~2,500
```

Never load the full `docs/` directory.
If a task requires it, the task is too large.

---

## Daily workflow

```bash
# Start of session — always
claude-code docs/agents/CONDUCTOR.md
# → DISPATCH.md tells you exactly what needs attention

# Execute a task
gemini docs/agents/EXEC.md docs/SPRINT.md --task TASK-042

# Refine a new idea
claude-code docs/agents/REFINE.md docs/REFINEMENT.md

# Close a sprint
claude-code docs/agents/RETRO.md docs/DONE.md
```

---

## Anti-collision protocol

Multiple agents can run in parallel safely:

1. `git pull` before selecting any task
2. Commit `IN_PROGRESS` status atomically — failed push = re-select
3. `IN_PROGRESS` tasks are untouchable by other agents
4. Lock field: `**Locked-by:** session-id | **Locked-at:** ISO timestamp`
5. Lock TTL: 4 hours. CONDUCTOR flags expired locks in DISPATCH.md

---

## Compatibility

| Standard | Role in ARCH |
|----------|-------------|
| `AGENTS.md` | AI entry point, symlinked from `docs/AGENTS.md` |
| `CLAUDE.md` | Symlink to `AGENTS.md` for Claude Code |
| `GEMINI.md` | Symlink to `AGENTS.md` for Gemini CLI |
| `MCP` | Tool integration layer |
| `SKILL.md` | Optional skills can extend `docs/agents/` |

---

## Quick start

```bash
npx arch-init my-project
cd my-project
# 1. Edit docs/GUIDELINES.md — add your stack
# 2. Add your first idea to docs/REFINEMENT.md
# 3. Run: arch refine   ← AI closes gaps
# 4. Run: arch conduct  ← CONDUCTOR evaluates system state
# 5. Run: arch exec     ← Right CLI for the next task
```

---

## Status

**v0.1 — Method only.**
The framework and templates are the product.
CLI tooling follows adoption.

ARCH is a methodology first. Tooling follows adoption, not the other way around.

---

## Contributing

The method is the contribution.
If you use ARCH and discover a pattern that makes the framework better, open a PR against `docs/`. No code required.

---

## License

MIT — use it, fork it, build products on top of it.
