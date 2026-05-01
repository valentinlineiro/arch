# IDEA: conflict-resolver-agent
**Created:** 2026-05-01
**Source:** ADR-001 "Merge conflicts as feature"
**Status:** DRAFT
**Meta:** P1 | M | 7-operations | local
<!-- cli: local | claude | gemini | human -->

## Problem
ADR-001 dice que merge conflicts son feature, no bug. Realidad: si dos agentes tocan docs/INBOX.md a la vez, el humano resuelve manual. Con L2/L3 esto pasa 5+ veces/día. Humano se vuelve bot de git merge. Fricción mata Autonomy.

## Proposed solution
Agente conflict-resolver en L2. Cuando git merge falla, DO mode ejecuta resolver que: 1. Si conflicto es solo append en INBOX.md, hace auto-merge cronológico. 2. Si conflicto es en TASK Status, gana el commit con timestamp más reciente. 3. Si conflicto es en código, escala a INBOX con diff. Solo mergea cambios triviales, resto a humano.

## Dependencies
None

## Estimated size
M

## Gaps
- Riesgo: auto-merge mal hecho corrompe INBOX y pierdes trazabilidad
- Definir "trivial" sin falsos positivos que escalen todo

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
