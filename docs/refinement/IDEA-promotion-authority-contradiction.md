## IDEA: Fix IDEA promotion authority contradiction
**Author:** review | **Status:** OPEN | **Focus:** yes

### Problem
AGENTS.md:18 grants THINK autonomous XS promotion, but AGENTS.md:33 and DO.md:25 require explicit human instruction. THINK.md:22 contradicts by instructing automatic promotion for DECIDED ideas.

### Proposed Solution
Align authority: either THINK has L2 autonomy (current AGENTS.md:18) or it requires explicit promotion (current DO.md:25). Choose one and document consistently.

### Evidence
- AGENTS.md:18: "Agent may autonomously promote..."
- AGENTS.md:33: "Promoting a draft: explicit human instruction required"
- DO.md:25: same explicit instruction requirement
- THINK.md:22: "autonomously promote... if DECIDED"

### Priority
High - governance conflict