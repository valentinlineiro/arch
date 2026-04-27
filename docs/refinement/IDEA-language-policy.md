## IDEA-language-policy
**Type:** process | **Source:** Kaizen 2026-04-27 | **Priority:** P2

### Observation
Docs mix English (headers) with Spanish (task titles, some guidelines). No explicit policy exists. This creates friction for non-Spanish contributors and makes translation harder.

### Current drift
- Task titles: Spanish ("Crear y publicar", "Detectar drift")
- Guidelines: Mixed (bugs.md: "Definición de bug", core.md: English headers)
- Core docs (AGENTS.md, DO.md, THINK.md): English

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

### Multilingual support (future)
- HTML UIs: Add i18n JSON layer
- Docs: Use `<!-- lang: en -->` frontmatter for explicit declaration
- No file variants (.es.md) — doubles maintenance

### Value
- Consistent contributor experience
- Easier translation boundary
- Matches industry standard