## IDEA-language-policy
**Type:** process | **Source:** Kaizen 2026-04-27 | **Priority:** P2 | **Status:** DECIDED

### Observation
Docs mix English (headers) with Spanish (task titles, some guidelines). No explicit policy exists. This creates friction for non-Spanish contributors and makes translation harder.

### Proposal
Enforce English for all **new** work:
1. Add to `docs/guidelines/core.md`:
   ```
   - Language: English for all docs, headers, structure
   - Task titles: English only (no Spanish)
   - Legacy: Existing Spanish tasks grandfathered, translate on edit
   ```

2. Auto-fix in `arch review`:
   - Warn on non-ASCII titles in new tasks
   - Suggest English equivalent

### Decision
Enforce English for all documentation and task titles. Establish migration path for legacy content.
PROMOTE -> TASK-060