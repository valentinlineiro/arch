# IDEA: `arch task done` — Socratic Hansei Wizard
**Created:** 2026-05-15
**Source:** DaaS Sprint Reflection
**Status:** DRAFT
**Meta:** P1 | M | local | cli/src/main/ts/

## Problem
Hansei is often seen as "documentation ceremony." When required, users either forget the rules or provide shallow reflections. LLM-drafted Hansei (previously proposed) risks "rubber-stamping" and hollows out the cognitive value of the protocol.

## Proposed solution
Implement an interactive **Socratic Wizard** in `arch task done`.

**Workflow:**
1.  User runs `arch task done TASK-XXX`.
2.  CLI detects Hansei triggers (e.g., Task size M+, or significant Turn count delta).
3.  Instead of a text box, the CLI asks targeted questions:
    - "Your estimate was S, but it took 45 turns. Was the delta [SpecDrift], [LeakyAbstraction], or [Environment]?"
    - "What is the single constraint discovered that prevents this from happening again?"
4.  The CLI assembles the user's answers into a valid, structured `## Hansei` block and appends it to the task.

## Rationale
Mechanizes the *discipline* of reflection without automating the *thinking*. It forces the human to perform the diagnostic work while the CLI ensures compliance with the ADR-019 schema.

## Dependencies
`MarkTaskDone.ts`, `TaskValidator.ts`.

## Estimated size
M

## Decision
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
