## TASK-230: Separate arch govern (enforcement) from arch reflect (analysis)
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/use-cases/govern-system.ts, docs/agents/THINK.md
**Depends:** none

## Hansei
The `noConduct` flag on `GovernSystem.execute()` is now redundant (govern never calls conduct) but kept for backward compatibility — removing it would break callers passing the flag. The reflect command was restructured so that bare `arch reflect` runs THINK (matching AC intent), while `arch reflect influence` retains the diagnostics subcommand. The Commands drift check now validates govern and reflect are documented, closing the gap where these commands existed but were invisible to review.

## Approval
Approved-by: human | 2026-05-23
Notes: Retroactive approval — M task closed without Approval section.
