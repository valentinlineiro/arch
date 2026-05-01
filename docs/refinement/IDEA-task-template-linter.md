# IDEA: task-template-linter
**Created:** 2026-05-01
**Source:** CORE.md "Definition of Ready" + KAIZEN-LOG TASK-031 drift
**Status:** DRAFT
**Meta:** P1 | S | arch review | cli
<!-- cli: local | claude | gemini | human -->

## Problem
CORE.md dice que tasks deben cumplir TASK-FORMAT.md antes de READY. Hoy es manual. TASK-031 se archivó DONE sin ACs checkeados porque nadie validó formato. arch review mira ACs pero no valida que Meta: tenga Size válido o que Dependencies: exista.

## Proposed solution
arch review añade check: parsea docs/tasks/*.md con Status READY/REVIEW y valida schema. Falla si falta Meta:, Acceptance Criteria, Definition of Done, o si Size no es XS/S/M/L/XL. Bloquea promote de IDEA→TASK si template está mal. Poka-Yoke para Definition of Ready.

## Dependencies
TASK-156 Enforce AC completion

## Estimated size
S

## Gaps
- Schema debe vivir en TASK-FORMAT.md parseable, no en prosa
- Cómo manejar campos opcionales sin romper backward compat

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
