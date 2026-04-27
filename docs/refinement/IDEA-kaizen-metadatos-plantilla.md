# IDEA: Estandarización de metadatos en TEMPLATE.md para ideas
**Created:** 2026-04-26
**Source:** THINK v0.4 Kaizen Proposal
**Status:** DECIDED

## Proposal
Añadir un campo `Meta:` a la plantilla `docs/refinement/TEMPLATE.md` que incluya Prio, Tamaño, Herramienta y Contexto, similar al formato de las tareas. Esto permitirá que las ideas nazcan con una estructura compatible con el backlog desde el primer momento.

## Gaps
- **Compatibilidad:** ¿Debe el campo `Meta:` ser opcional para ideas pero obligatorio para tareas?
- **Validación:** ¿Cómo afectará esto al comando `arch review`? Debería actualizarse para validar borradores también.
- **Sincronización:** Asegurar que los valores permitidos (P0-P3, S-XL) sean consistentes con `GUIDELINES.md`.

## Decision
Meta: es opcional en borradores (ideas), obligatorio en tareas. arch review no valida borradores en esta fase.
PROMOTE → BACKLOG
