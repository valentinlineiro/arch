# IDEA: arch-metrics-dashboard
**Created:** 2026-05-01
**Source:** RETRO.md Sprint 2 "Velocity: 100%" + CORE.md Metrics requirement
**Status:** DRAFT
**Meta:** P2 | M | arch review | metrics
<!-- cli: local | claude | gemini | human -->

## Problem
Cycle time, cost per task, REVIEW_FAIL rate y token usage solo están en git log y commits. No hay vista agregada. THINK Phase 1 hace "Health Evaluation" manual. Para escalar a L3 Autonomy necesitas métricas en tiempo real para decidir si el agente es confiable.

## Proposed solution
`arch metrics` comando que parsea git log --grep=TASK- y genera docs/METRICS.md con: cycle time P50/P90 por Size, cost total/mes, REVIEW_FAIL %, drift count. Corre en THINK Phase 1 y publica badge en README. L3 se habilita solo si REVIEW_FAIL < 5% último mes.

## Dependencies
None

## Estimated size
M

## Gaps
- Dónde guardar costes históricos si git log no los tiene todos
- Performance: parsear 10k commits debe ser <2s

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
