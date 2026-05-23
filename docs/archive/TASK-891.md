## TASK-891: arch task create - Instant Task Scaffolding
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | local | cli/src/main/ts/ | Closed-at: 2026-05-15T12:30:00Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** The LLM returned title strings wrapped in double-quotes (e.g., "Glossary Command Addition") that propagated into the task header. The IDEA spec did not specify quote stripping. Fixed inline with a regex strip on the parsed title, adding one correction turn after smoke testing.
**Constraint:** LLM output is free-form text; any field parsed from it must be sanitized before use in structured markdown. The parseDraft method now strips leading/trailing quotes and non-ASCII characters from the title.
**Cost:** One extra turn to identify and fix the quote propagation bug during smoke testing. No rework of architecture required.
**Forward Action:** If LLM output quality issues recur, consider a more constrained output format (JSON) instead of line-by-line parsing. Track as an IDEA if the prose parser proves fragile.
