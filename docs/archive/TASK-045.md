## TASK-045: arch-viewer.html - anonymous task reading via GitHub API
**Meta:** P2 | M | DONE | Focus:yes | 2-code-generation | claude-code | docs/
**Depends:** TASK-032

### Acceptance Criteria
- [x] Create `docs/arch-viewer.html` - single HTML file, no framework
- [x] Read tasks from `docs/tasks/` via anonymous GitHub API, interpreting `Focus: yes/no`
- [x] Show status, priority, size, and title of each task
- [x] Drift section: show output of `arch review` (Commands / Version / Paths)
- [x] Handle anonymous rate-limit with clear message to user
- [x] Published on GitHub Pages from `docs/`

### Definition of Done
- [x] HTML functional with anonymous reading
- [ ] PR approved
