# REFINEMENT.md
<!-- Ideas being refined before entering BACKLOG -->
<!-- One draft at a time. Promote or reject before adding next. -->

## Current draft

### EXEC.md — validar prefijo de commit contra tabla de GUIDELINES

**Problem:** EXEC genera commits con prefijos ad-hoc (`chore`, `feat`, `fix`) sin validar contra la tabla de tipos de commit definida en GUIDELINES.md. Esto produce inconsistencias en el historial.

**Idea:** Agregar un paso explícito en el protocolo de EXEC que exija que el prefijo del commit pertenezca a los tipos aprobados en GUIDELINES.md antes de hacer el commit. Si el tipo no aplica claramente, elegir el más cercano y documentarlo.

**Open questions for REFINE:**
- ¿GUIDELINES.md ya tiene una tabla de tipos de commit? ¿Está completa?
- ¿El agente debe fallar si no hay match, o proponer y continuar?
- ¿Aplica también a HUMAN.md y CONDUCTOR?

**Draft date:** 2026-04-23

---

### Campo "Committed:" en SPRINT.md — evaluar eliminación

**Problem:** El campo `Committed:` en SPRINT.md es de actualización manual y genera drift entre lo que dice el archivo y lo que hay en git. Es ruido estructural más que valor real.

**Idea:** Eliminar el campo `Committed:` de la plantilla de tareas en SPRINT.md. La fuente de verdad de commits es git (`git log --grep=TASK-XXX`). Si hace falta auditabilidad, el PR asociado ya lo cubre.

**Open questions for REFINE:**
- ¿Hay algún agente que lea `Committed:` para tomar decisiones? (si sí, es bloqueante)
- ¿Migración: eliminar el campo de las tareas activas o solo de la plantilla forward?)
- ¿Reemplazar con un campo derivado (link al PR) que sí aporte valor?

**Draft date:** 2026-04-23

---

### CONDUCTOR — reducir falsos positivos en checks de salud

**Problem:** El CONDUCTOR generó una acción para investigar status drift. La investigación no encontró nada. Costo: una sesión entera de agente en ruido. El CONDUCTOR está siendo conservador en exceso.

**Evidence:** Commits `8c44980` (commit DISPATCH.md — sprint 1 action queue) y `8a35f50` (complete status drift investigation — no drift detected).

**Idea:** Revisar los checks del CONDUCTOR y agregar umbrales o evidencia requerida antes de emitir una acción de investigación. Un check solo debe producir una acción si hay señal concreta (e.g., tarea IN_PROGRESS sin commit en X días), no por precaución genérica.

**Open questions for REFINE:**
- ¿Cuáles checks actuales del CONDUCTOR son los más propensos a falsos positivos?
- ¿Agregar un campo de confianza a cada acción de DISPATCH.md? (`Low/Medium/High`)
- ¿Distinguir entre acciones de investigación (bajo valor) y acciones de ejecución (alto valor)?

**Draft date:** 2026-04-23

---

## Refinement history

| Date | Title | Outcome |
|------|-------|---------|
| 2026-04-23 | HUMAN agent — duplicate detection before task creation | Promoted to TASK-018 (BACKLOG) |
| 2026-04-23 | DISPATCH.md staleness — Last-invalidated protocol | Promoted to TASK-017 (BACKLOG) |
| 2026-04-23 | Mandatory EXEC Commits before REVIEW | Promoted to TASK-016 (BACKLOG) |
| 2026-04-23 | REVIEWER agent protocol | Promoted to TASK-012 (BACKLOG) |
| 2026-04-23 | HUMAN agent dual-file sync on sprint move | Promoted to TASK-013 (BACKLOG) |
