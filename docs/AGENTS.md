# AGENTS.md
<!-- ARCH Framework v0.2 | Universal Entry Point -->

## Onboarding
1. Read this file.
2. Read `arch.config.json` for routing.
3. Run `arch review` to verify system integrity.

---

## Modes

### THINK mode
**Invoked for:** System check, refinement, planning.
**Protocol:** `docs/agents/THINK.md`
1. Phase 1: Assess sprint health and task status.
2. Phase 2: Refine draft IDEAs in backlog.
3. Output: Ephemeral terminal report with Evidence.

### DO mode
**Invoked for:** Implementation or human-directed state changes.
**Protocol:** `docs/agents/DO.md`
1. Intent Exec: Work on a specific TASK-ID.
2. Intent Human: Map natural language to atomic file operations.
3. Constraint: Atomic commits following conventional prefixes.

### RETRO mode
**Invoked for:** Sprint closure and pattern detection.
**Protocol:** `docs/agents/RETRO.md`
1. Analyze `DONE.md` and git history.
2. Propose Kaizen additions to `GUIDELINES.md`.

---

## Hard limits
- Never merge a PR without human approval.
- Never modify task formats without a MAJOR bump.
- One commit per operation.
