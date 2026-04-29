## TASK-122: Review mutates repository state during verification
**Meta:** P0 | XS | 8 | REVIEW | Focus:yes | 7-operations | local | cli/src/main/ts/application/commands/review-command.ts

## Problem
`./scripts/arch.sh review` is documented as verification ("verify system integrity") but it creates and commits new tasks on failure. Verification should not have write side effects.

## Evidence
- AGENTS.md:7: "run ./scripts/arch.sh review to verify system integrity"
- THINK.md:43: "output is ephemeral terminal reporting"
- review-command.ts:33,79: creates and commits new task on failure

## Impact
Onboarding step mutates state, breaking the contract that verification is read-only.

## Acceptance Criteria
- [x] `arch review` is read-only — no file creation or git commits on failure
- [x] Violations are reported to terminal, not auto-fixed
- [x] Document the non-mutating behavior in AGENTS.md onboarding