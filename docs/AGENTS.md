# AGENTS.md
<!-- ARCH Framework v0.1 | Compatible with AGENTS.md open standard -->
<!-- CLAUDE.md and GEMINI.md are symlinks to this file -->

## Onboarding
Read in order before any action:
1. This file
2. `docs/ROUTING.md` (select your CLI mode)
3. The specific task or document you were invoked for

Do not read the full `docs/` directory. Load only what your task declares in `Context-budget`.

---

## Project context
<!-- HUMAN: Fill this section. Keep it under 150 tokens. -->
**Stack:** Markdown, Bash, Node.js (arch-init CLI)
**Repo structure:** docs/ (framework files) + scripts/ (installers)
**Key constraint:** Task format backward compatibility — changes require MAJOR bump + migration guide

---

## Modes

### CONDUCTOR mode
Invoked when: session start, sprint checkpoint, or "what needs attention?"

Protocol:
1. Read `docs/agents/CONDUCTOR.md`
2. Read: `docs/SPRINT.md`, `docs/BACKLOG.md` (status fields only), `docs/DONE.md` (last 5), `docs/RETRO.md` (last entry)
3. Run evaluation checklist
4. Write `docs/DISPATCH.md` — action queue for humans and agents
5. Stop — do not execute any action from DISPATCH.md in the same session

### EXEC mode
Invoked when: executing a task from `docs/SPRINT.md`

Protocol:
1. Read `docs/agents/EXEC.md`
2. Read the specific task (identified by TASK-ID)
3. Change task status to `IN_PROGRESS`, commit immediately
4. Implement against Acceptance Criteria only — no unrequested scope
5. On completion: status → `REVIEW`, open PR with TASK-ID in title
6. Do not touch other tasks, do not refactor outside task scope

### REFINE mode
Invoked when: a new idea exists in `docs/REFINEMENT.md`

Protocol:
1. Read `docs/agents/REFINE.md`
2. Read the draft idea only
3. Optionally read: last ADR relevant to the topic, last entry in `docs/RETRO.md`
4. Respond with: gaps in the proposal, dependency flags, kaizen suggestions from history
5. Never promote a task to `docs/BACKLOG.md` without explicit human instruction

### RETRO mode
Invoked when: a sprint closes and `docs/DONE.md` has new entries

Protocol:
1. Read `docs/agents/RETRO.md`
2. Read `docs/DONE.md` (last 10 tasks only)
3. Detect patterns: sizing accuracy, dependency gaps, DoD failures, repeated issues
4. Propose additions to `docs/GUIDELINES.md` — human decides what gets committed

### HUMAN mode
Invoked when: human wants to communicate intent to the system (e.g. task completion, status updates)

Protocol:
1. Read `docs/agents/HUMAN.md`
2. Follow the "What the human might say" logic to map natural language intent to operations
3. Perform required file operations (status changes, task creation, moves, etc.)
4. Commit exactly once per operation
5. Stop — do not perform any other mode logic in the same session

---

## Hard limits
- Never merge a PR without human approval
- Never modify `docs/GUIDELINES.md` directly — propose only
- Never take tasks in `IN_PROGRESS` or `BLOCKED` status
- Never assume missing context — declare what's needed and stop
- Never generate speculative code outside task scope
- If a task requires reading more files than its `Context-budget` declares: flag it, don't proceed

---

## Status vocabulary
`BACKLOG` → `READY` → `IN_PROGRESS` → `REVIEW` → `DONE`
`BLOCKED` (requires human intervention before proceeding)
