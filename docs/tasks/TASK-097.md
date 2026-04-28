## TASK-097: ARCH control panel - Angular project scaffold and GitHub Pages deployment
**Meta:** P3 | M | 5 | READY | Focus:no | 2-code-generation | human | ui/

### Acceptance Criteria
- [ ] Angular project created in `ui/` with standalone components, Angular Router, and separate CSS/HTML/TS files per component.
- [ ] Shared module includes: `NavComponent`, `ThemeService` (dark mode), `GithubApiService` (handles anonymous + OAuth GitHub API calls).
- [ ] Root routes defined: `/initializr`, `/viewer`, `/assistant`, `/onboarding`.
- [ ] GitHub Actions workflow builds `ui/` and deploys to GitHub Pages on push to main.
- [ ] App shell renders correctly on GitHub Pages (base href configured).
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
