## TASK-098: ARCH control panel - migrate initializr to Angular component
**Meta:** P3 | S | READY | Focus:no | 2-code-generation | human | docs/, docs/arch-initializr.html
**Depends:** TASK-097

### Acceptance Criteria
- [ ] `InitializrComponent` created with separate `initializr.component.ts`, `initializr.component.html`, `initializr.component.css`.
- [ ] All logic from `arch-initializr.html` migrated: routing config form, file generation, download.
- [ ] GitHub API calls use the shared `GithubApiService`.
- [ ] Visual output matches the original tool.
- [ ] `arch-initializr.html` is deleted from `docs/`.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
