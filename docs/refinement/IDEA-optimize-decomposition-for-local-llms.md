# IDEA: optimize-decomposition-for-local-llms
**Created:** 2026-05-01
**Source:** User request "idea: mejorar refine para que exista mayor cantidad de tareas XS y S"
**Status:** DRAFT
**Meta:** P1 | M | docs/agents/THINK.md | refinement
<!-- cli: local | claude | gemini | human -->

## Problem
El ahorro de costes y la eficiencia de Ollama dependen de que las tareas sean XS o S. Sin embargo, el proceso de refinamiento actual a menudo genera tareas M o L que obligan a usar Claude/Gemini. Si el agente no descompone agresivamente, perdemos la ventaja competitiva de los modelos locales.

## Proposed solution
Ajustar el protocolo `THINK.md` (Fase 2: Refinement) para incluir una heurística de "Local-First Decomposition". Cuando el agente evalúa una IDEA o una TASK de tamaño M o superior, debe intentar obligatoriamente dividirla en al menos 2 o 3 tareas XS/S si la lógica es modularizable. Añadir un check en `arch review` que advierta si existen demasiadas tareas M/L sin una justificación de "razonamiento complejo".

## Dependencies
IDEA-ollama-local-integration (Implemented)

## Estimated size
S

## Gaps
- Riesgo de "Task Fragmentation": demasiadas tareas minúsculas pueden aumentar el overhead de gestión (más archivos .md, más commits).
- Definir qué tareas *realmente* requieren Claude (ej: cambios arquitectónicos cross-file) vs cuáles son XS (ej: añadir un test, cambiar un schema).

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
