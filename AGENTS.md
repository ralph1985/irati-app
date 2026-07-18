# Instrucciones Para Agentes

Irati es una aplicación privada para Rafa y Begoña orientada al seguimiento de peso y vacunas de Irati. El objetivo del MVP es responder rápido a cómo evoluciona el peso y qué vacunas están pendientes, próximas, aplicadas o retrasadas.

## Prioridad E Idioma

- Trabajar en español con el usuario.
- Usar ramas y commits en inglés.
- Prioridad documental: `AGENTS.md`, `PROJECT_CONTEXT.md`, `docs/spec.md`, `docs/roadmap.md` y `docs/agent-memory/*`.
- Antes de ampliar alcance, comprobar el hito activo en `docs/roadmap.md` y la especificación viva en `docs/spec.md`.

## Modo Rápido Por Defecto

- Leer primero archivos probables y hacer búsquedas concretas; no revisar todo el repo si no hace falta.
- Usar el mínimo agente y la mínima validación proporcional al cambio.
- No activar revisores transversales por defecto.
- No actualizar documentación salvo que cambien uso, scripts, arquitectura, decisiones estables, agentes, skills o estado de hitos.
- No añadir nuevas capas, carpetas vacías o abstracciones fuera de la arquitectura existente sin una responsabilidad actual.
- La arquitectura hexagonal por módulos ya existe; respetar los `.gitkeep` actuales, pero no usarlos como precedente para crear estructura especulativa.

## Estado Técnico Actual

- Stack: Next.js 16, React 19, TypeScript, pnpm, Supabase remoto, Supabase CLI, Vercel, PWA, ESLint, Prettier y Vitest.
- Entrada de la app privada: `src/app/(app)/`.
- Login/logout: `src/app/login/route.ts` y `src/app/logout/route.ts`.
- Shell de navegación inferior: `src/app/(app)/_components/app-shell.tsx`.
- Módulos principales: `src/modules/auth`, `src/modules/profile`, `src/modules/weight`, `src/modules/vaccines` y `src/modules/backup`.
- Cliente y tipos Supabase: `src/shared/infrastructure/supabase/`.
- Migraciones Supabase: `supabase/migrations/*.sql`.
- Backups remotos de Supabase: `scripts/backup-supabase.sh` y scripts relacionados.
- Documentación funcional: `docs/spec.md`, `docs/roadmap.md`, `docs/database-schema.md` y `docs/vaccine-calendar.md`.

## Restricciones Técnicas

- No añadir nuevos backends, cuentas separadas, offline de datos, realtime, email, push notifications, analytics, Redux, Tailwind, librerías de componentes ni dependencias nuevas sin necesidad actual y permiso explícito.
- No tocar `.env`, `.env.local`, credenciales ni tokens.
- Supabase remoto es la fuente principal de datos; no introducir Docker, Supabase local ni persistencia paralela salvo petición explícita.
- La app es PWA instalable, pero los datos requieren conexión en el MVP.
- No exponer datos privados antes de autenticar.
- Las reglas de dominio importantes deben vivir en dominio/aplicación y ser testeables sin navegador ni base de datos.
- La UI no debe depender directamente de Supabase cuando exista puerto/adaptador del modulo.

## Selección De Agentes

- Coordinación normal: `coordinator`.
- Cambios visuales o de UX de producto privado: `product_ui`.
- Dominio, casos de uso, Supabase, migraciones, vacunas, peso o backups: `domain_data`.
- Auth, passcode, cookies, sesión, rate limit o exposición de datos privados: `auth_security`, solo si la tarea lo pide explícitamente.
- Configuración de agentes, skills o memoria: `agent_config_reviewer`.
- Revisión final completa o bloqueante: `qa_final_reviewer`.

No crear agentes de SEO, enlaces externos, CSP público o contenido comercial hasta que exista una necesidad real. Irati es una app privada sin superficie SEO ni contenido público.

## Git

- Revisar `git status --short --branch` antes de modificar y antes de commitear.
- El flujo normal es trabajo directo en `main` con commits pequeños.
- No hacer push, merge ni abrir PR salvo petición explícita.
- Respetar cambios locales ajenos.
- Usar rutas explícitas en `git add`; evitar `git add .`, `git add -A` y `git add --all`.
- Commits pequeños con Conventional Commits en inglés.
- Las operaciones que escriben en `.git` pueden necesitar permisos escalados por restricciones del sandbox.

## Validación

- Cambios de producto: ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test` y `pnpm build`.
- Cambios de dominio/datos: incluir tests unitarios o de aplicación proporcionales y revisar migraciones si aplica.
- Cambios de auth/seguridad: validar tests de passcode, sesión, cookie y rate limit cuando correspondan.
- Cambios solo documentales o de agentes: validar TOML/frontmatter cuando aplique y ejecutar `git diff --check`; si hay archivos nuevos sin trackear, revisar también esas rutas directamente o después de staging. No ejecutar build si no aporta valor.
- No ocultar fallos ni desactivar reglas para que pasen comprobaciones sin una razón técnica clara.

## Memoria Y Documentación

- `PROJECT_CONTEXT.md` guarda contexto estable del proyecto.
- `docs/agent-memory/decisions.md` guarda decisiones estables y acotadas.
- `docs/agent-memory/known-issues.md` guarda problemas operativos conocidos.
- Editar memoria solo si la tarea lo pide, si cambia una decisión estable o si se mantiene la configuración de agentes/documentación.
- La memoria no sustituye a revisar el repo real.

## Resumen Final

Al cerrar una tarea sustancial, incluir:

```txt
Rama:
Commit:
Archivos tocados:
Checks:
Notas:
Siguiente tarea:
```
