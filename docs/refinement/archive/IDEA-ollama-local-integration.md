# IDEA: ollama-local-integration
**Created:** 2026-05-01
**Source:** User request "I have ollama available in its cli locally. How can we integrate it to develop?"
**Status:** DRAFT
**Meta:** P2 | M | cli | local
<!-- cli: local | claude | gemini | human -->

## Problem
Dependencia total de LLMs en la nube (Gemini, Claude) implica costes por token, latencia de red y preocupaciones de privacidad para ciertos datos locales. Para tareas de tamaño XS/S o para desarrollo offline, el uso de LLMs propietarios es ineficiente.

## Proposed solution
Integrar Ollama como un proveedor (provider) adicional en el CLI de ARCH. Permitir configurar modelos locales (ej: llama3, mistral) en `arch.config.json`. El sistema de routing debería permitir derivar tareas específicas (ej: `arch review` local o generación de tests unitarios) a Ollama cuando esté disponible.

## Dependencies
None

## Estimated size
M

## Gaps
- Rendimiento de modelos pequeños (7B/8B) siguiendo protocolos ARCH complejos.
- Estandarización de la API de Ollama vs OpenAI/Google.
- Manejo de timeouts y recursos de hardware local.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
