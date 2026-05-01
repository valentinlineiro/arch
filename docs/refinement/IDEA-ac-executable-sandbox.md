# IDEA: ac-executable-sandbox
**Created:** 2026-05-01
**Source:** IDEA-anti-hallucination-acs gaps "Safety"
**Status:** DRAFT
**Meta:** P0 | L | arch review | cli/src/main/ts/domain/services
<!-- cli: local | claude | gemini | human -->

## Problem
ACs ejecutables propuestos en IDEA-anti-hallucination-acs pueden correr rm -rf / si el reviewer no tiene sandbox. Hoy arch review confía en que el AC es seguro. Un agente malicioso o alucinado puede meter AC destructivo y DO lo ejecuta en L3.

## Proposed solution
AC Runner con allowlist: solo test, grep, jq, node, git status, curl --head. Ejecuta en container node:alpine sin red, 30s timeout, filesystem read-only excepto /tmp. ACs que pidan network/red/write requieren tag privileged:yes + Human approval en INBOX antes de ejecutar.

## Dependencies
TASK-156 Enforce AC completion, IDEA-anti-hallucination-acs

## Estimated size
L

## Gaps
- Cross-platform: Docker no está en Windows por defecto. Fallback a firejail o VM?
- Cómo validar que el container no tiene escape

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
