# IDEA: Si hacemos kaizen continuo, ¿necesitamos sprint o solo backlog?
**Created:** 2026-04-27
**Source:** Human request via DO
**Status:** DECIDED
**Meta:** P1 | S | claude | docs/agents/, docs/AGENTS.md ← opcional, rellenar si se conoce

## Problema
El sprint como contenedor de trabajo asume que hay un ciclo de planificación periódico. Si THINK hace kaizen continuo (retrospectiva en cada sesión) y los bugs van directo a sprint sin planificación, ¿qué valor aporta el sprint como abstracción separada del backlog?

## Solución propuesta
Evaluar si el sistema puede simplificarse a: backlog ordenado por prioridad + ejecución continua, eliminando la distinción sprint/backlog como directorios separados.

## Dependencias
Ninguna técnica. Requiere decisión estratégica antes de cualquier implementación.

## Tamaño estimado
S — principalmente cambio de protocolo y posible migración de estructura de directorios.

## Gaps
- **Velocidad:** Sin límite de sprint, ¿cómo medimos throughput? ¿Tareas cerradas por semana en lugar de por sprint?
- **Contexto:** Si todo está en un directorio plano, el agente lee todas las tareas en cada sesión — hoy `sprint/` actúa como filtro de contexto presupuestario.
- **Formato:** Todos los tasks tienen `Sprint N` en Meta. Un sistema flat requiere migración de formato o un nuevo campo alternativo.
- **Híbrido:** ¿Opción intermedia? Un solo `docs/tasks/` con campo `Focus: yes/no`, o solo ordenación por prioridad sin directorios separados.
- **Tamaño estimado:** S si es solo cambio de protocolo. M si incluye migración de estructura de directorios y cambios en el CLI.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->

PROMOTE → TASK-047

**Propuesta de THINK:** Modelo híbrido — directorio único `docs/tasks/` con campo `Focus: yes/no` en Meta.
- `Focus:yes` reemplaza sprint/, `Focus:no` reemplaza backlog/. Un archivo, una ubicación.
- Velocidad → tareas cerradas por semana via campo `Closed-at:` (TASK-014).
- Migración: renombrar directorios + añadir Focus: a cada Meta + cambio CLI.
- Tamaño: M (protocolo + migración + CLI).
