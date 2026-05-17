## TASK-901: Socratic Hansei Wizard: pre-validation completion mechanism for arch task done
**Meta:** P1 | M | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/, cli/src/main/ts/application/commands/task-command.ts
**Closed-at:** 2026-05-17T11:55:46.602Z

**Depends:** none

### Context

Hansei is treated as ceremony — users fill it in hastily or leave fields shallow. The wizard replaces the blank form with targeted Socratic questions. It forces diagnostic thinking without automating the thinking itself.

**Architectural invariant:** the wizard is a pre-validation completion mechanism, not a second gate. `TaskValidator.validateHansei()` remains the sole constitutional enforcement layer. The wizard is additive UX — it exists to help the human produce a valid Hansei before the validator runs, not to govern the invariant in parallel.

**Correct execution model:**
```
arch task done TASK-XXX
  → check ## Hansei state
  → if missing OR any required field empty → launch wizard
  → wizard fills Hansei interactively
  → TaskValidator.validateHansei() runs on final state
  → DONE succeeds or fails on validator result
```

**Trigger:** Hansei state validity — section absent OR any required field (Severity, Category, Decision, Constraint, Cost, Forward Action) is empty or a placeholder. Not task size. Not turn count. Those are hints for wizard question framing, never the canonical trigger.

**Non-TTY:** wizard is skipped. If Hansei is still incomplete after skip, `MarkTaskDone` emits: `Hansei required. Run in a TTY or pre-fill ## Hansei in the task file.` and exits 1.

### Acceptance Criteria

- [x] `HanseiWizard` service at `cli/src/main/ts/application/use-cases/hansei-wizard.ts`:
  - `isHanseiComplete(content: string): boolean` — returns true only when all 6 required fields (Severity, Category, Decision, Constraint, Cost, Forward Action) are present and non-empty (not placeholder text, not "None.", not "Not yet started."). This is the canonical trigger condition.
  - `run(task: Task): Promise<string>` — runs interactive prompts via readline when TTY is available. Returns completed `## Hansei` block string.
  - `file: cli/src/main/ts/application/use-cases/hansei-wizard.ts`

- [x] `MarkTaskDone.execute()` execution order is strictly:
  1. Call `HanseiWizard.isHanseiComplete()` — if incomplete and TTY available, call `HanseiWizard.run()` and write result to task file
  2. If incomplete and non-TTY, emit error and exit 1
  3. Call `TaskValidator.validateHansei()` — this is the only enforcement layer
  4. Continue to archive
  `file: cli/src/main/ts/application/use-cases/mark-task-done.ts`

- [x] Wizard presents exactly these questions in order:
  1. Severity: numbered list (H0 no issue / H1 minor deviation / H2 pattern to track / H3a reject and rework / H3b systemic risk)
  2. Category: numbered list of valid ADR-019 categories with 5-word descriptions
  3. Decision: "What happened? One sentence." (free text, min 15 chars)
  4. Constraint: "What limitation did you discover?" (free text, min 10 chars)
  5. Cost: "What debt was introduced, if any?" (free text, min 10 chars; "None introduced" is acceptable)
  6. Forward Action: "What should happen next, if anything?" (free text; "None required" is acceptable)
  - Complexity metadata (size, turn count) is shown as context before questions, not used as trigger
  - `file: cli/src/main/ts/application/use-cases/hansei-wizard.ts`

- [x] Unit tests:
  - `isHanseiComplete` returns true for fully-populated Hansei, false for missing section, false for any empty/placeholder field
  - `run()` skipped when `isHanseiComplete` returns true (no wizard launched)
  - Assembled Hansei block passes `TaskValidator.validateHansei()` for all severity/category combinations
  - Non-TTY path: wizard skipped, `MarkTaskDone` exits 1 with correct message when Hansei incomplete
  - `prose: 415 tests pass — verified during implementation`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H1
**Category:** [AuditGap]
**Decision:** isHanseiComplete had a minLen=5 check applied to Severity field (H0=2 chars). Fixed by separating enum checks from text field length checks. 402 tests pass.
**Constraint:** The placeholder regex only catches bare "None." — "None required." passes. Intentional: Forward Action often legitimately needs no follow-up.
**Cost:** No architectural debt introduced. One test fixture required updating to use a non-placeholder Forward Action string.
**Forward Action:** console.log replaced with stdout.write wrapper — use-case layer boundary compliance restored.

## Approval
Approved-by: Auditor | 2026-05-17
