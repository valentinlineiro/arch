# IDEA: `arch task done` — Socratic Hansei Wizard
**Created:** 2026-05-15
**Source:** DaaS Sprint Reflection
**Status:** PROMOTED
**Sessions:** 2
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

## Session 1 Evaluation (2026-05-15)
**5-axis constraint assessment:**
| Axis | Status | Note |
|------|--------|------|
| Dependency ordering | Satisfied | MarkTaskDone.ts and TaskValidator.ts are in place (TASK-892 completed) |
| Temporal validity | Satisfied | DaaS sprint demonstrates Hansei-as-ceremony is a real friction point |
| Abstraction layer | Satisfied | CLI command layer — correct scope |
| Observability validity | Satisfied | CLI can detect size/turns from task metadata |
| Priority displacement | Satisfied | Natural next step in DaaS sequence |

**Structural admissibility: SATISFIED.** Ready for human promotion decision.

## Decision
PROMOTE → TASK-901

## Session 2 Refinement (2026-05-16)
**Gap resolved:** Trigger condition. The wizard runs when `arch task done TASK-XXX` is called and the `## Hansei` section is absent or has any field empty/placeholder. If Hansei is already fully populated, the wizard is skipped and `arch task done` proceeds normally. This makes the wizard additive — it does not disrupt tasks where Hansei was written inline.

**Revised workflow:**
1. `arch task done TASK-XXX` called
2. CLI reads task file — if `## Hansei` is complete, skip wizard entirely
3. If Hansei is missing or incomplete: run Socratic questions interactively
4. Assemble answers into valid `## Hansei` block, write to task file
5. Proceed with existing Hansei validation (`TaskValidator.validateHansei`)

**Scope confirmed:** M, `MarkTaskDone.ts` + new `HanseiWizard` service in `cli/src/main/ts/application/use-cases/`. Non-blocking for non-TTY sessions (CI/pipe → skip wizard, require pre-filled Hansei).
**Sessions:** 2
