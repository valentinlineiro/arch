# IDEA: Recolectar puntos débiles de ARCH
**Created:** 2026-04-26
**Source:** Human request via THINK mode
**Status:** DECIDED

## Proposal
Establecer un proceso sistemático para identificar y recolectar los puntos débiles, fricciones y cuellos de botella de la metodología ARCH. Esto incluye tanto ineficiencias técnicas (consumo de tokens) como operativas (fricción para el humano o el agente).

## Gaps
- **Métricas:** ¿Cómo cuantificamos un "punto débil"? Necesitamos definir KPIs (ej. ratio de tareas fallidas, tiempo de refinamiento, coste de tokens por tarea).
- **Recolección:** ¿Debe el agente reportar fricciones automáticamente al final de cada `DO` o `THINK`?
- **Almacenamiento:** ¿Creamos un archivo `docs/KAIZEN-LOG.md` o usamos un sistema de etiquetas en el histórico de Git?
- **Categorización:** Diferenciar entre debilidades de *Protocolo* (reglas), *Herramienta* (CLI) y *Contexto* (exceso de archivos).

## Decision
Crear docs/KAIZEN-LOG.md con categorías: Protocolo / Herramienta / Contexto. KPI en lenguaje natural, sin métricas cuantitativas en v1. Los agentes reportan fricciones de forma manual al final de THINK o DO cuando las detectan.
PROMOTE → BACKLOG
