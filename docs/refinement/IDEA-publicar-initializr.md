# IDEA: publicar arch-initializr.html en GitHub Pages docs/
**Created:** 2026-04-26
**Source:** Human request via Manus
**Status:** DECIDED

## Proposal
publicar arch-initializr.html en GitHub Pages docs/

## Gaps
- **Funcionalidad:** ¿Es una herramienta estática o requiere lógica de cliente para generar el scaffold?
- **Riesgo:** Si genera archivos, ¿cómo se descargan? (Zip vs Copy-paste).
- **Consistencia:** Debe usar la misma lógica que `arch-init.sh` para evitar divergencias en la estructura de carpetas.

## Decision
Genera ZIP descargable o abre repo en GitHub (GitHub template / `use this template`). El HTML debe crearse antes de publicarlo. Debe ser consistente con `arch-init.sh`.
PROMOTE → BACKLOG
