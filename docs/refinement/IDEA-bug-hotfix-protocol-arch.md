# IDEA: Handle warns as bugs — define bug and hotfix protocol in ARCH
**Created:** 2026-04-27
**Source:** Human request via arch think
**Status:** DRAFT

## Proposal
Handle warns as bugs. We need to define bug and hotfix protocol in ARCH.

## Gaps
- **Definición de bug:** ¿"bug" incluye solo errores de CLI o también inconsistencias de protocolo y documentación? ¿Los WARNs de `arch review` son bugs o deuda técnica catalogada?
- **Severidad:** ¿Cuándo un bug merece hotfix (flujo acelerado) vs tarea normal? Propuesta: P0 = bloqueante para el agente, P1 = degradado funcional, P2 = cosmético/warn.
- **Flujo de hotfix:** ¿El hotfix bypasea el backlog e ingresa directo al sprint? ¿Requiere PR o puede mergearse directo en main? ¿Puede un agente auto-asignarse?
- **Registro de WARNs:** Si los WARNs de `arch review` son bugs, ¿se registran como tareas automáticamente o solo con decisión humana explícita?
- **Tamaño estimado:** XS si es solo `docs/guidelines/bugs.md`. S si también implica cambios en `arch review` para clasificar severidad con exit codes diferenciados.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
