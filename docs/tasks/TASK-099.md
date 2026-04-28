## TASK-099: ARCH control panel - migrate viewer to Angular component
**Meta:** P3 | S | 5 | READY | Focus:no | 2-code-generation | human | ui/src/app/viewer/, docs/arch-viewer.html
**Depends:** TASK-097

### Acceptance Criteria
- [ ] `ViewerComponent` created with separate `viewer.component.ts`, `viewer.component.html`, `viewer.component.css`.
- [ ] All logic from `arch-viewer.html` migrated: task list rendering, status filters, archive view.
- [ ] GitHub API calls use the shared `GithubApiService`.
- [ ] Visual output matches the original tool.
- [ ] `arch-viewer.html` is deleted from `docs/`.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
