# Resources — GitHub CLI Cheat Sheet

Referencia local de comandos `gh` frecuentes. Sin enlaces externos.

## Pull Requests

```bash
gh pr create --title "title" --body "body"   # Crear PR
gh pr list                                    # Listar PRs abiertos
gh pr view <number>                           # Ver detalle de un PR
gh pr checkout <number>                       # Hacer checkout de un PR
gh pr merge <number> --squash                 # Mergear PR (squash)
gh pr close <number>                          # Cerrar PR sin mergear
gh pr review <number> --approve               # Aprobar PR
gh pr review <number> --request-changes -b "reason"  # Solicitar cambios
gh pr diff <number>                           # Ver diff de un PR
```

## Issues

```bash
gh issue create --title "title" --body "body"  # Crear issue
gh issue list                                   # Listar issues abiertos
gh issue view <number>                          # Ver detalle
gh issue close <number>                         # Cerrar issue
gh issue comment <number> --body "comment"      # Comentar en issue
gh issue edit <number> --add-label "bug"        # Editar etiquetas
```

## Repositorio

```bash
gh repo view                        # Ver info del repo actual
gh repo clone <owner>/<repo>        # Clonar repo
gh repo fork                        # Fork del repo actual
gh repo create <name> --public      # Crear repo nuevo
```

## Releases

```bash
gh release create v1.0.0 --title "v1.0.0" --notes "notes"  # Crear release
gh release list                                               # Listar releases
gh release view v1.0.0                                        # Ver release
gh release upload v1.0.0 ./dist/*.zip                        # Subir assets
```

## Workflows (GitHub Actions)

```bash
gh workflow list                              # Listar workflows
gh workflow run <workflow-name>               # Disparar workflow manualmente
gh run list                                   # Ver ejecuciones recientes
gh run view <run-id>                          # Ver detalle de una ejecución
gh run watch <run-id>                         # Seguir ejecución en tiempo real
```

## Utilidades

```bash
gh auth status                    # Verificar autenticación
gh api /repos/:owner/:repo        # Llamada directa a la API de GitHub
gh browse                         # Abrir repo en el navegador
gh gist create <file>             # Crear gist
```
