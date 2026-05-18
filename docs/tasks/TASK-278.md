## TASK-278: Define domain packs specification - composable protocol extensions
**Meta:** P2 | S | READY | Focus:no | 6-writing | claude | docs/guidelines/, arch.config.json

### Context

ARCH's protocol is implicitly tuned for software engineering. Applying it to other domains (startup, household, personal) requires undocumented manual adaptation. Domain packs are composable protocol extensions that provide domain-specific task templates, AC patterns, guideline sets, and review criteria, activated via `arch.config.json`. This task defines the specification — not full implementation.

### Acceptance Criteria

- [ ] A design document or ADR specifies the domain pack format: structure, activation mechanism in `arch.config.json`, and at least the software pack (current default) formally documented.
- [ ] The specification is concrete enough to guide implementation of a second domain pack (startup or household).
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Domain packs specification written and placed in docs/adr/ or docs/guidelines/.
- [ ] `arch review` passes.
