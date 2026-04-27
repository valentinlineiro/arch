# IDEA: publicar arch-assistant.html con Gemini free tier en docs/
**Created:** 2026-04-26
**Source:** Human request via Manus
**Status:** DECIDED

## Proposal
publicar arch-assistant.html con Gemini free tier en docs/

## Gaps
- **Seguridad:** El uso de Gemini Free Tier requiere una API Key. Publicarlo en GitHub Pages (cliente) expone la clave si no se usa un proxy o se pide al usuario su propia clave.
- **UX:** Debe implementar el protocolo de `THINK.md` para ser un asistente ARCH real.
- **Coste:** Confirmar límites de cuota de Gemini Free Tier para uso multi-agente.

## Decision
API Key user-provided: el usuario ingresa su propia clave de Gemini en la interfaz. Sin proxy. El HTML debe crearse antes de publicarlo.
PROMOTE → BACKLOG
