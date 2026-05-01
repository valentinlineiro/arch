# IDEA: multi-repo-arch
**Created:** 2026-05-01
**Source:** ADR-001 "History Bloat" trade-off
**Status:** DRAFT
**Meta:** P3 | XL | arch review | architecture
<!-- cli: local | claude | gemini | human -->

## Problem
ADR-001 acepta "History Bloat" como trade-off. 25k commits/año = repo de 2GB en 3 años. git clone duele. Monorepo con 10 servicios ARCH = 20GB. CI lento. arch review escanea miles de tasks archivadas innecesarias.

## Proposed solution
arch.config.json > paths > archiveRemote: git@github.com:org/arch-archive.git. Al hacer arch archive TASK-160, DO mueve el .md a repo archive y deja symlink o stub en repo principal con Archived: <commit-sha>. arch review ignora stubs. git log --grep=TASK-160 sigue funcionando con git remote add archive. Sharding por año: arch-archive-2026.git.

## Dependencies
None

## Estimated size
XL

## Gaps
- Symlinks no funcionan bien en Windows. Usar .arch-stub file?
- Búsqueda cross-repo: git log ya no es global. Necesitas arch search --all-repos
- Complejidad: si el repo archive cae, pierdes historia

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
