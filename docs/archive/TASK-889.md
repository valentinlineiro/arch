## TASK-889: arch task edit - Interactive Metadata Management
**Meta:** P1 | S | REVIEW | Focus:no | 2-code-generation | local | cli/src/main/ts/
**Created-at:** 2026-05-15T07:23:10.296Z
**Depends:** none

### Acceptance Criteria
- [x] arch task edit TASK-XXX subcommand added to TaskCommand → grep: "subCommand === 'edit'" cli/src/main/ts/application/commands/task-command.ts
- [x] CLI reads the current task and displays each editable meta field with current value in brackets → prose: verified interactively, each field shown with current value
- [x] User input validated against TaskValidator before any file is written → grep: "TaskValidator" cli/src/main/ts/application/use-cases/edit-task-metadata.ts
- [x] On success, task file updated with correctly formatted meta line and committed → prose: verified by running arch task edit and confirming chore: commit in git log
- [x] arch review passes after the edit → cmd: node cli/dist/index.js review; exit: 0

#### Problem
The `**Meta:**` line in ARCH tasks is a high-discipline regex-based string. Manually editing it (e.g., changing `P2` to `P1` or updating `Context`) is brittle and often causes `arch review` failures due to formatting errors.

#### Solution
Implement `arch task edit TASK-XXX` as an interactive CLI command.

**Workflow:**
1.  `arch task edit TASK-064`
2.  CLI displays current values and prompts for changes:
    - Priority (P0-P3)
    - Size (XS-XL)
    - Status (READY, BLOCKED, etc.)
    - Class (Select from registry)
    - Context (Comma-separated paths)
3.  CLI validates the new values against the `TaskValidator`.
4.  CLI updates the file directly and commits the change with a `chore: update metadata for TASK-XXX` message.

### Definition of Done
- [x] All ACs checked → prose: all ACs above marked complete
- [x] arch review passes → cmd: node cli/dist/index.js review; exit: 0

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** The promote command scaffolded a Depends field with source-file paths instead of TASK-IDs, and the generated title contained a non-ASCII em dash that failed system review. Both required post-promote correction before the task was valid. Additionally, the AC predicate format (grep: requires quoted pattern before filepath) was not documented and required reading validator source code to discover.
**Constraint:** The promote command's transformIdeaToTask maps IDEA Dependencies verbatim into the Depends field without distinguishing code dependencies from task dependencies. This is a known limitation of the promote scaffold.
**Cost:** Approximately 3 extra turns spent correcting the promoted task file, fixing the em dash title, and discovering the undocumented grep predicate format.
**Forward Action:** Document AC predicate format in TASK-FORMAT.md so implementers do not need to read source to discover it. The Depends field ambiguity is a separate bug in the promote scaffold worth an IDEA.
