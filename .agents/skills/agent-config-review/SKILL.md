---
name: agent-config-review
description: Usar solo al revisar o modificar AGENTS.md, PROJECT_CONTEXT.md, docs/agent-memory, la configuración .codex, agentes o skills locales.
---

# Revisión De Configuración De Agentes

1. Confirma si la tarea permite editar y usa `AGENTS.md` como autoridad.
2. Haz primero un inventario con `rg --files` y rutas relevantes; no abras todo el repositorio.
3. Lee solo la configuración afectada. Abre archivos completos cuando una búsqueda concreta lo justifique.
4. Valida TOML, nombres de agentes y esquema permitido.
5. En skills, valida frontmatter, coincidencia entre carpeta y `name`, y que la `description` sea restrictiva.
6. Separa responsabilidades: política crítica en `AGENTS.md`, contexto estable en `PROJECT_CONTEXT.md`, decisiones en `docs/agent-memory`, rol y límites en agentes, procedimiento reutilizable en skills.
7. Busca activadores amplios, lecturas globales, duplicidades, contradicciones y supuestos obsoletos sobre rutas o tecnología.
8. Comprueba que el resultado no aumenta complejidad sin justificacion para una app privada.

No inspecciones código de producto, assets, lockfile ni memoria histórica salvo relación directa. Indica archivos revisados, cambios necesarios, riesgos y validaciones.
