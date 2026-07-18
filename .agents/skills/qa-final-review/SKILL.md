---
name: qa-final-review
description: Usar para una revisión completa o bloqueante, antes de cerrar un hito o cuando el usuario pida validar una implementación; no para todo cambio pequeño.
---

# Revisión Final De QA

1. Compara objetivo, `docs/spec.md`, `docs/roadmap.md`, diff y archivos cambiados.
2. Ejecuta `git status --short`, `git diff --stat`, `git diff --name-only` y comprobaciones dirigidas; usa `git diff --check` cuando aporte valor. Si hay archivos nuevos sin trackear, revisa también esas rutas directamente o después de staging.
3. Detecta cambios fuera de alcance, archivos inesperados, ruido, datos sensibles y reglas incumplidas.
4. Revisa solo áreas afectadas: UI, dominio/datos, auth/seguridad, backups o agentes.
5. En documentación, memoria, agentes o skills, valida coherencia, brevedad y ausencia de datos privados solo si esos archivos han cambiado.
6. No ejecutes build para cambios solo documentales o de agentes. Para cambios de producto, exige las comprobaciones proporcionales definidas en `AGENTS.md`.
7. Reporta evidencia, validaciones no ejecutadas y riesgo residual. No inventes resultados ni corrijas problemas ajenos.

Finaliza solo si el cambio cumple la petición, el diff es mínimo y se respetan los límites del repositorio.
