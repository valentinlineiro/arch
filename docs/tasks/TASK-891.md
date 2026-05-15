## TASK-891: arch task create - Instant Task Scaffolding
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | local | cli/src/main/ts/
**Depends:** none

### Acceptance Criteria
- [ ] arch task create "<intent>" subcommand scaffolds a task file at docs/tasks/TASK-XXX.md → file: docs/tasks/TASK-891.md
- [ ] LLM drafting attempted for title, ACs, size, and class based on the intent string → prose: verified by running arch task create with a configured provider and inspecting output
- [ ] Fallback to skeleton-only task (empty ACs, default size S, default class 2-code-generation) when no LLM is available → prose: verified by running arch task create with no provider configured
- [ ] ContextInference runs and injects relevant context into the scaffolded task file → grep: "ContextInference" cli/src/main/ts/application/use-cases/create-task.ts
- [ ] Generated task file passes arch lint before being written to disk → prose: verified by inspecting the created file for valid meta line format
- [ ] New task is committed automatically with a chore: commit → prose: verified via git log after arch task create
- [ ] arch review passes → cmd: node cli/dist/index.js review; exit: 0
- [ ] npm test passes → cmd: npm test --prefix cli; exit: 0

### Context
#### Problem
Creating a new task requires manually creating a file, copying a template, and filling in metadata. This "creation friction" leads to users doing work that isn't tracked or postponing task decomposition.

#### Solution
Implement `arch task create "<intent>"` to scaffold a task file instantly.

**Behavior:**
1. **Drafting:** The CLI uses an LLM (in a non-enforcement role) to draft ACs, Size, and Class from the intent string.
2. **Fallback:** If no LLM is configured or available, fall back to a skeleton task (empty ACs, size S, class 2-code-generation) without failing.
3. **Context Inference:** Run ContextInference to inject relevant files/ADRs into the task.
4. **File Creation:** Creates `docs/tasks/TASK-XXX.md` with status READY.
5. **Validation:** The generated meta line must pass TaskValidator before the file is written.

### Definition of Done
- [ ] All ACs checked → prose: all ACs above verified
- [ ] arch review passes → cmd: node cli/dist/index.js review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Pre-implementation assessment. The primary design risk is the LLM-drafting path: the CLI must call a configured provider without knowing which one is available at runtime. The existing provider routing in arch.config.json strategies map class+size to providers — the create command can use the same routing to select a provider for the draft call.
**Constraint:** LLM output is advisory only — it must pass the same TaskValidator regex as human content before the file is written. The LLM cannot set status to anything other than READY.
**Cost:** No retrospective cost yet. Update at REVIEW with actual findings.
**Forward Action:** Verify LLM fallback path works correctly when no provider is configured. Check that the create command integrates cleanly with the existing exec/bridge provider infrastructure rather than duplicating it.
