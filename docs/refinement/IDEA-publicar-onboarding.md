# IDEA: publicar ONBOARDING.html en GitHub Pages docs/
**Created:** 2026-04-26
**Source:** Human request via Manus
**Status:** DECIDED

## Proposal
publicar ONBOARDING.html en GitHub Pages docs/

## Gaps
- **Contexto:** ¿Existe ya el archivo `ONBOARDING.html` o debe crearse de cero?
- **Infraestructura:** Requiere configuración de GitHub Pages en el repositorio.
- **Contenido:** Debe estar sincronizado con `AGENTS.md` para no generar deuda de documentación.
- **Dependencias:** Ninguna técnica, pero se recomienda realizar tras TASK-032 para asegurar consistencia.

## Decision
Crear ONBOARDING.html de cero: el flujo arranca preguntando al usuario sus requisitos funcionales para el proyecto.
Infraestructura: GitHub Pages via GitHub Actions (gh-pages branch o docs/ folder).
Contenido sincronizado con AGENTS.md.
PROMOTE → TASK-044
