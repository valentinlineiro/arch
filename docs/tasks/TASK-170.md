## TASK-170: Improve UX when loop needs human feedback
**Meta:** P2 | S | READY | Focus:no | 2-code-generation | local | cli/, docs/agents/
**Depends:** - `IDEA-simplify-cli-ux.md` (related)

### Acceptance Criteria
- [ ] Improve UX when loop needs human feedback

### Context
#### Problem
Currently, when `arch loop` halts for human intervention (Andon Cord or AWAITING_APPROVAL), the experience is disjointed:
1. The loop exits with a log message and a non-zero code.
2. The user must manually open `docs/INBOX.md` to see the details.
3. The user must manually edit `INBOX.md` with `APPROVE` or `REDIRECT`.
4. The user must run `arch loop --resume` to continue.

There is no "bridge" between the CLI halt and the required manual intervention, leading to friction in the human-agent loop.


### Definition of Done
- [ ] All ACs checked.
- [ ] arch review passes.
