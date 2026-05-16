## TASK-193: Implement arch next - single-task dispatch command
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/, cli/src/main/ts/index.ts, scripts/arch.sh
**Closed-at:** 2026-05-06T10:46:32.716Z
**Depends:** none

## Approval
Approved-by: Auditor | 2026-05-06

## Hansei
The partial implementation already in place (NextCommand + SelectNextTask) required a full rewrite rather than an extension — the existing sort put Focus third after size, and there was no halt infrastructure at all. Cleaner to have started from a greenfield rather than inheriting the partial state.
