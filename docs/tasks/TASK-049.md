## TASK-049: Ignorar artefactos runtime locales como .codex
**Meta:** P2 | XS | REVIEW | Focus:no | 7-operations | human | .gitignore, .git/info/exclude, docs/guidelines/
**Depends:** none

### Acceptance Criteria
- [x] Definir dónde deben ignorarse artefactos runtime locales (`.gitignore` repo vs `.git/info/exclude` local)
- [x] Añadir una regla concreta para `.codex` en la ubicación elegida
- [x] Documentar la decisión si afecta a otros operadores o agentes

### Definition of Done
- [x] El worktree no muestra `.codex` como ruido recurrente en el entorno previsto
- [ ] PR aprobado o decisión local aplicada conscientemente
