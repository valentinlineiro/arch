## TASK-046: arch-viewer.html — task state editing with GitHub OAuth
**Meta:** P2 | M | DONE | Focus:yes | 2-code-generation | claude-code | docs/
**Depends:** TASK-045

### Acceptance Criteria
- [x] Add GitHub OAuth sign-in to `docs/arch-viewer.html` (via Personal Access Token)
- [x] With active session: allow changing task status (READY → IN_PROGRESS → DONE) via GitHub API
- [x] Without session: read-only mode (TASK-045 behavior unchanged)
- [x] Status change writes to the .md file in the repo via GitHub API (Contents API)

### Definition of Done
- [x] HTML functional with authenticated editing on top of TASK-045
- [ ] PR approved
