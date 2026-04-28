## BUG: Review mutates repository state during verification
**Author:** review | **Status:** OPEN | **Focus:** yes

### Problem
`./scripts/arch.sh review` is documented as verification ("verify system integrity") but it creates and commits new tasks on failure. Verification should not have write side effects.

### Evidence
- AGENTS.md:7: "run ./scripts/arch.sh review to verify system integrity"
- THINK.md:43: "output is ephemeral terminal reporting"
- review-command.ts:33,79: creates and commits new task on failure

### Impact
Onboarding step mutates state, breaking the contract that verification is read-only.

### Priority
High