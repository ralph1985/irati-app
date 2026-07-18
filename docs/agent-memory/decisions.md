# Decisiones De Agentes

Este archivo guarda decisiones estables y acotadas que deben sobrevivir a futuras sesiones de trabajo en Irati.

## Configuración Local De Agentes

- Irati usa una configuración híbrida ligera: coordinador, QA final, UI de producto, dominio/datos, auth/seguridad y revisión de configuración.
- No se crean agentes de SEO, enlaces externos, CSP público o contenido comercial mientras Irati siga siendo una app privada sin superficie pública relevante.
- El agente `auth_security` puede editar solo cuando la tarea pida explícitamente cambios de auth o seguridad.
- Las skills locales son procedimientos restrictivos: `qa-final-review`, `agent-config-review` y `safe-mainline-git`.

## Flujo Git

- El flujo normal de Irati es trabajar directo en `main` con commits pequeños.
- El push no se hace salvo petición explícita del usuario.
- El staging usa rutas explícitas; no usar `git add .`, `git add -A` ni `git add --all`.

## Producto Y Arquitectura

- Irati conserva arquitectura hexagonal por módulos bajo `src/modules`.
- La app es PWA instalable, pero los datos requieren conexión en el MVP.
- Supabase remoto es la fuente principal; no usar Docker, Supabase local, offline ni realtime por defecto.
- Para cambios de producto relevantes, `docs/spec.md` y `docs/roadmap.md` deben quedar alineados con el comportamiento esperado.
