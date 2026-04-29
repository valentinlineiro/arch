## TASK-127: Resolve promotion authority contradiction across protocol files
**Meta:** P1 | XS | 8 | IN_PROGRESS | Focus:no | 6-writing | local | docs/AGENTS.md, docs/agents/DO.md, docs/agents/THINK.md

## Problem
AGENTS.md:18 grants THINK autonomous promotion of XS ops/writing IDEAs, but AGENTS.md:33 and DO.md:25 require explicit human instruction. The word "promote" conflates two distinct acts — deciding and executing — causing ambiguity about when autonomy applies.

## Solution
Split the acts: human always decides (writes Decision in IDEA file), THINK autonomously executes (creates task file, updates IDEA status). L2 autonomy applies only to execution, never to the decision.

## Acceptance Criteria
- [ ] `docs/AGENTS.md` line ~18: clarify "Agent may autonomously **execute** promotion of XS ops/writing IDEAs where human has already written a Decision."
- [ ] `docs/AGENTS.md` line ~33: add "Deciding to promote requires human instruction. Executing an already-decided promotion is THINK-autonomous."
- [ ] `docs/agents/DO.md` section 7: align with same distinction — explicit human instruction governs the decision, not the file operation.
- [ ] `docs/agents/THINK.md` line ~22: add explicit note that DRAFT → DECIDED transition requires human; THINK executes promotion only on DECIDED IDEAs.
- [ ] `arch review` passes.
