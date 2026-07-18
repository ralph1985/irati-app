---
name: safe-mainline-git
description: Usar solo cuando haya stage, commits, historial, push, GitHub CLI o una auditoría Git explícita en Irati; no por consultas de solo lectura durante QA.
---

# Flujo Git Seguro En Main

No activar solo porque una revisión ligera consulte `git status` o `git diff` sin realizar operaciones Git.

## Estado

1. Ejecuta `git status --short --branch` y `git branch --show-current`.
2. El flujo normal de Irati trabaja directo en `main`.
3. Para ante cambios locales ajenos imprevistos o si la rama no es `main` y el usuario no pidió trabajar ahí.
4. Antes de publicar, confirma que `origin` apunta al repo esperado y que el worktree queda limpio.

## Escrituras Y Commit

- Ejecuta fuera del sandbox cualquier escritura en refs, `HEAD`, index o commits cuando el sandbox lo requiera.
- Antes del commit, revisa status, stat, nombres de archivos y diff.
- Usa `git add` solo con rutas explícitas; nunca `.`, `-A` ni `--all`.
- Crea commits pequeños con Conventional Commits en inglés.
- No hagas merge, rebase, force push, reescritura del historial, stash, resets destructivos, checkout forzado ni limpieza sin permiso.

## Publicación

- Push solo por petición explícita del usuario.
- Push normal permitido: `git push origin main` o el equivalente pedido por el usuario.
- No abras PR salvo petición explícita.
- No instales ni reconfigures `gh`, no uses comandos interactivos, no cambies credenciales y no muestres tokens.

Los errores de permisos sobre `.git`, refs, `HEAD` o index pueden ser limitaciones del sandbox; no diagnostiques el worktree como roto solo por eso.
