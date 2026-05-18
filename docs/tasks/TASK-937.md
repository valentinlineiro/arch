## TASK-937: Implement proportional protocol — lightweight XS capture, close, and template
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/commands/capture-command.ts, docs/TASK-FORMAT.md, docs/AGENTS.md

### Context

TASK-934 established tiered Hansei/Approval obligations (XS/S: triggered-only; M/L/XL: mandatory). The remaining friction is in the task creation and close path: `arch task capture` generates the same AC template regardless of size, the close path runs an interactive Hansei wizard on XS tasks even when no trigger condition applies, and the Definition of Done section is generated for all sizes despite being optional for XS.

This task targets those three friction points without touching the L3 gate, Auditor bypass conditions, or governance semantics.

### Non-Goals

- No change to the L3 gate (DeterministicACVerifier conditions unchanged)
- No change to Auditor bypass eligibility
- No change to Hansei trigger conditions (blocker, size miss, anomaly still require Hansei on XS/S)
- No change to task file requirement (XS tasks still need a file in docs/tasks/)

### Gaps

- **Hansei wizard TTY detection**: the current wizard checks for TTY before prompting. The fast-path for XS tasks should skip the wizard entirely when no trigger condition is present, not just suppress the prompt. Confirm behavior when the loop runs non-interactively (currently the wizard fails-closed on non-TTY; fast-path should exit cleanly).
- **Template selection in capture**: `CaptureCommand` applies a single AC template. Need to confirm whether class+size combination is available at template selection time, or whether size must be inferred from the `--size` flag.

### Acceptance Criteria

- [ ] `arch task capture` with `--size XS` and class `6-writing` or `7-operations` generates a stripped template: one AC line, no Definition of Done section, no Hansei placeholder.  →  prose: verified by running arch task capture with XS size and inspecting generated task file
- [ ] `arch task done TASK-XXX` on an XS task with no trigger condition (no blocker, no size miss, no M+) skips the Hansei wizard entirely and proceeds to close without TTY interaction.  →  prose: verified by running arch task done on a clean XS task in non-interactive mode
- [ ] `docs/TASK-FORMAT.md` explicitly documents that Definition of Done is optional for XS tasks (not just "may be omitted" — canonical statement).  →  grep: "XS" docs/TASK-FORMAT.md
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0
- [ ] CLI tests pass.  →  cmd: npm test --prefix cli; exit: 0

### Definition of Done

- [ ] A developer creating an XS operational task via `arch task capture` gets a minimal template without manual editing.
- [ ] The automated loop can close an XS task with no trigger conditions without human TTY interaction.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Scope deliberately narrow: three friction points only (template, close path, DoD exemption). No changes to L3 gate or Auditor bypass conditions. All non-goals documented explicitly to prevent scope creep during implementation.

**Constraint:**
TASK-934 (tiered obligations) is the prerequisite; this is the follow-on. Both are needed to fully close the XS ceremony gap — neither is complete without the other.

**Cost:**
Stripped XS template reduces documentation surface; operators may omit context that would have been useful. Acceptable trade: the friction cost of the full template on XS work is higher than the occasional missed context.

**Forward Action:**
Monitor whether XS self-archive rate increases after this ships. If it does not, the close-path friction is not the binding constraint — look at capture friction instead.
