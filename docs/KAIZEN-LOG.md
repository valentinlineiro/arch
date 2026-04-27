# KAIZEN-LOG
<!-- Registro de puntos débiles, fricciones y cuellos de botella de ARCH -->
<!-- Categorías: Protocolo | Herramienta | Contexto -->
<!-- Formato: cada entrada en lenguaje natural, sin métricas cuantitativas en v1 -->

---

## Protocolo

- **Bugs sin registro formal** *(Sprint 3)*: Los WARNs de `arch review` no tenían un camino definido hacia el backlog. Se crearon TASK-041/042/043 manualmente tras detectarlos. El protocolo de bugs (TASK-040) resolvió esto, pero la fricción existió durante todo Sprint 2 y parte de Sprint 3.

- **Tareas legacy con dependencias podridas** *(Sprint 3)*: TASK-007, TASK-014, TASK-021 referenciaban RETRO.md, HUMAN.md y SPRINT.md monolítico — todos eliminados en Sprint 3. Requirieron triage manual. Señal: cuando se elimina un artefacto, hay que buscar activamente referencias en el backlog.

- **Sprint vs backlog como duplicidad estructural** *(Sprint 3)*: Al decir "mover todo al sprint" el backlog quedó vacío — evidencia de que la separación era artificial. Se promovió TASK-047 para resolverlo con un modelo de directorio único + campo Focus.

---

## Herramienta

- **`arch review` no valida ACs antes de archivar** *(Sprint 3)*: TASK-031 fue archivado con DONE pero sin ACs marcadas. El reviewer detectó la inconsistencia pero no bloqueó el archivo en su momento. La detección llegó tarde (sesión siguiente).

- **Commit de lock batch no pasa el validator de TASK-ID** *(Sprint 3)*: Al lockear 4 tareas en un commit `[SPRINT]`, `arch review` reportó violación de formato. El validator asume un único TASK-ID por commit — los commits de planificación batch son un edge case no cubierto.

- **`arch --version` no existe como subcomando** *(Sprint 3)*: El drift checker compara versiones leyendo package.json directamente porque el CLI no implementa `--version`. Es un workaround funcional pero inconsistente con la convención estándar de CLIs.

---

## Contexto

- **IDEAs sin estructura antes de TASK-033** *(Sprint 3)*: El TEMPLATE original solo tenía `## Proposal` sin campos estructurados. THINK tenía que inferir gaps sin contexto de dependencias o tamaño. Las primeras 8 IDEAs se refinaron con más fricción de la necesaria.

- **Terminología antigua en backlog legacy** *(Sprint 3)*: CONDUCTOR, EXEC, DISPATCH.md, SPRINT.md monolítico — términos de v0.1 que sobrevivieron a la migración modular. Requirieron triage manual para detectarlos y actualizarlos.
