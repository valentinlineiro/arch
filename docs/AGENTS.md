# AGENTS.md
<!-- ARCH Framework v0.6.0 | Universal Entry Point -->

## Onboarding
1. Read this file.
2. Read `arch.config.json` for routing.
3. Run `arch review` to verify system integrity. This command is **read-only** — it reports violations but does not create tasks or modify repository state.

---

## Modes

### THINK mode
**Invoked for:** System check, refinement, planning, and continuous Kaizen.
**Protocol:** `docs/agents/THINK.md`
1. Phase 1: Governance & Replenishment (Status check, archival, and replenishment).
2. Phase 2: Refine draft IDEAs in `docs/refinement/`. 
   - *Autonomy (L2):* Agent may autonomously **execute** promotion of IDEAs that are XS and class operations/writing, **only when the human has already written a Decision in the IDEA file.** The agent never decides to promote — it executes a human decision.
3. Phase 3: Continuous Kaizen (Simplification and metrics).
4. Output: Ephemeral terminal report with Evidence.

### DO mode
**Invoked for:** Implementation or human-directed state changes.
**Protocol:** `docs/agents/DO.md`
1. Intent Exec: Work on a specific task in `docs/tasks/` (Focus:yes).
2. Intent Ops: Manual task/idea management and sprint operations.
3. Constraint: Atomic commits following conventional prefixes.

---

## Refinement flow
- `idea:` prefix in DO → draft in `docs/refinement/` → THINK evaluates → human promotes → BACKLOG
- Direct task description (no prefix) → BACKLOG directly, no refinement required
- Promoting a draft: the **decision** to promote requires explicit human instruction (human writes `PROMOTE → TASK-XXX` in the IDEA's Decision section). The **execution** of an already-decided promotion is THINK-autonomous for XS ops/writing IDEAs.

## Hard limits
- Never merge a PR without human approval.
- One commit per operation.
- Modular task integrity: One task per file in `docs/tasks/`.

## Bug protocol
Any ARCH misalignment is a bug. See `docs/guidelines/bugs.md` for the full protocol.
