# AGENTS.md
<!-- ARCH Framework v0.5.0 | Universal Entry Point -->

## Onboarding
1. Read this file.
2. Read `arch.config.json` for routing.
3. Run `./scripts/arch.sh review` to verify system integrity.

---

## Modes

### THINK mode
**Invoked for:** System check, refinement, planning, and continuous Kaizen.
**Protocol:** `docs/agents/THINK.md`
1. Phase 1: Assess task health by scanning `docs/tasks/` (Focus:yes = active).
2. Phase 2: Refine draft IDEAs in `docs/refinement/`. 
   - *Autonomy (L2):* Agent may autonomously promote IDEAs to TASKS if they are XS and class operations/writing.
3. Phase 3: Propose real-time Kaizen and guideline improvements.
4. Phase 4: Autonomous Replenishment (if READY tasks < 3).
5. Output: Ephemeral terminal report with Evidence.

### DO mode
**Invoked for:** Implementation or human-directed state changes.
**Protocol:** `docs/agents/DO.md`
1. Intent Exec: Work on a specific task in `docs/tasks/` (Focus:yes).
2. Intent Human: Map natural language to atomic file operations (moves between directories).
3. Constraint: Atomic commits following conventional prefixes.

---

## Refinement flow
- `idea:` prefix in DO → draft in `docs/refinement/` → THINK evaluates → human promotes → BACKLOG
- Direct task description (no prefix) → BACKLOG directly, no refinement required
- Promoting a draft: explicit human instruction required (`./scripts/arch.sh do "promover IDEA-[slug]"`)

## Hard limits
- Never merge a PR without human approval.
- One commit per operation.
- Modular task integrity: One task per file in `docs/tasks/`.
