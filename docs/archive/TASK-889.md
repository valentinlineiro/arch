## TASK-889: arch task edit - Interactive Metadata Management
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | local | cli/src/main/ts/ | Closed-at: 2026-05-15T11:45:00Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** The promote command scaffolded a Depends field with source-file paths instead of TASK-IDs, and the generated title contained a non-ASCII em dash that failed system review. Both required post-promote correction before the task was valid. Additionally, the AC predicate format (grep: requires quoted pattern before filepath) was not documented and required reading validator source code to discover.
**Constraint:** The promote command's transformIdeaToTask maps IDEA Dependencies verbatim into the Depends field without distinguishing code dependencies from task dependencies. This is a known limitation of the promote scaffold.
**Cost:** Approximately 3 extra turns spent correcting the promoted task file, fixing the em dash title, and discovering the undocumented grep predicate format.
**Forward Action:** Document AC predicate format in TASK-FORMAT.md so implementers do not need to read source to discover it. The Depends field ambiguity is a separate bug in the promote scaffold worth an IDEA.
