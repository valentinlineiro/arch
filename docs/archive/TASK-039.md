## TASK-039: Create and publish arch-viewer.html connected to GitHub API
**Meta:** P2 | L | REJECTED | Backlog | 2-code-generation | claude-code | docs/
**Depends:** TASK-032

### Acceptance Criteria
- [ ] Create `docs/arch-viewer.html` — single HTML file, no framework
- [ ] Without session: read tasks via GitHub API (anonymous rate-limit applies)
- [ ] With session (GitHub OAuth): write task status (READY/IN_PROGRESS/DONE)
- [ ] GitHub OAuth sign-in implemented with standard GitHub Apps or personal token flow
- [ ] Visual integration with TASK-032 (show system Drift section)
- [ ] Published on GitHub Pages from `docs/`

### Definition of Done
- [ ] HTML functional with anonymous reading and authenticated editing
- [ ] PR approved
