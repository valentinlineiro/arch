## TASK-100: ARCH control panel - migrate assistant to Angular component
**Meta:** P3 | S | READY | Focus:no | 2-code-generation | human | ui/src/app/assistant/, docs/arch-assistant.html
**Depends:** TASK-097

### Acceptance Criteria
- [ ] `AssistantComponent` created with separate `assistant.component.ts`, `assistant.component.html`, `assistant.component.css`.
- [ ] All logic from `arch-assistant.html` migrated.
- [ ] GitHub API calls use the shared `GithubApiService`.
- [ ] Visual output matches the original tool.
- [ ] `arch-assistant.html` is deleted from `docs/`.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
