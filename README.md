# Irati

Irati es una aplicación privada para Rafa y Begoña orientada al seguimiento diario de Irati. Permite consultar la evolución del peso, gestionar el calendario de vacunas y mantener una checklist de viaje compartida.

La aplicación está pensada para móvil, se puede instalar como PWA y protege los datos familiares detrás de un passcode validado en servidor.

## Estado del proyecto

Irati está en desarrollo activo. El alcance y las decisiones vigentes se mantienen en [`docs/spec.md`](docs/spec.md), mientras que el avance por hitos está en [`docs/roadmap.md`](docs/roadmap.md).

## Funcionalidades principales

- Acceso privado mediante passcode compartido.
- Perfil básico de Irati.
- Registro, historial y gráfica de peso con filtro por lugar.
- Calendario de vacunas planificadas y registro de vacunas aplicadas.
- Estados y avisos internos de vacunas pendientes, próximas, aplicadas o retrasadas.
- Checklist de viaje reutilizable y compartida.
- PWA instalable con navegación adaptada a móvil.
- Supabase remoto como fuente principal de datos.
- Backups locales automatizables de Supabase.

## Stack

- Next.js 16 con App Router y React 19.
- TypeScript y pnpm.
- Supabase remoto.
- PWA con Serwist.
- ESLint, Prettier y Vitest.
- Vercel como destino de despliegue.

## Requisitos

- Node.js 22 o compatible con el proyecto.
- pnpm 10 o compatible.
- Un proyecto remoto de Supabase para la aplicación.

Comprueba las versiones instaladas antes de empezar:

```bash
node --version
pnpm --version
```

## Puesta en marcha local

1. Instala las dependencias:

   ```bash
   pnpm install
   ```

2. Crea el archivo local de entorno a partir de la plantilla:

   ```bash
   cp .env.example .env.local
   ```

3. Completa las variables de `.env.local` con valores del entorno de desarrollo. No subas este archivo ni compartas sus valores.

4. Genera el hash del passcode compartido:

   ```bash
   pnpm auth:hash -- <passcode>
   ```

   Guarda el resultado en `IRATI_PASSCODE_HASH`. Genera también un secreto aleatorio para `SESSION_SECRET`, por ejemplo con `openssl rand -hex 32`.

5. Aplica las migraciones al proyecto remoto de Supabase usando el flujo de Supabase CLI configurado para ese proyecto:

   ```bash
   pnpm exec supabase db push
   ```

6. Arranca el servidor de desarrollo:

   ```bash
   pnpm dev
   ```

   La aplicación estará disponible normalmente en <http://localhost:3000>.

## Variables de entorno

La plantilla completa está en [`.env.example`](.env.example):

| Variable                         | Uso                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`       | URL del proyecto Supabase remoto.                                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Clave pública del proyecto Supabase.                                                       |
| `SUPABASE_SERVICE_ROLE_KEY`      | Acceso de servidor para operaciones privadas y backups. Nunca debe exponerse al navegador. |
| `IRATI_PASSCODE_HASH`            | Hash del passcode compartido.                                                              |
| `SESSION_SECRET`                 | Secreto usado para firmar las sesiones.                                                    |
| `IRATI_GOOGLE_CALENDAR_ICAL_URL` | URL iCal del calendario, si está configurado.                                              |
| `IRATI_GOOGLE_CALENDAR_WEB_URL`  | URL web del calendario, si está configurado.                                               |

Las claves y secretos deben configurarse también en el entorno de despliegue de Vercel. No se guardan en Git, en capturas ni en logs.

## Comandos habituales

```bash
pnpm dev                    # servidor de desarrollo
pnpm build                  # build de producción
pnpm start                  # servidor con el build generado
pnpm typecheck              # comprobación de TypeScript
pnpm lint                   # ESLint
pnpm format                 # comprobación de formato
pnpm test                   # tests de Vitest
pnpm backup:supabase        # backup remoto en var/backups/supabase/
```

Antes de cerrar un cambio de producto, ejecuta `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test` y `pnpm build`.

## Backups

`pnpm backup:supabase` genera un archivo comprimido con esquema, datos y metadatos en `var/backups/supabase/`. Esa carpeta está ignorada por Git.

Para instalar el cron de backup cada seis horas:

```bash
pnpm backup:supabase:cron:install
```

El backup necesita `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Consulta [`docs/spec.md`](docs/spec.md) para conocer la retención y las opciones de configuración.

## Estructura del proyecto

```text
src/app/                    Rutas y layouts de Next.js
src/modules/                Módulos de auth, perfil, peso, vacunas y backup
src/shared/                 Código compartido e infraestructura Supabase
supabase/migrations/        Migraciones versionadas
scripts/                    Hash de passcode, backups y cron
docs/                       Especificación, roadmap y decisiones técnicas
```

La aplicación usa una arquitectura hexagonal pragmática: las reglas de dominio y los casos de uso no deben depender directamente de Supabase ni del navegador.

## Seguridad y privacidad

Irati contiene datos familiares privados. No introduzcas secretos en el repositorio ni ejecutes la aplicación con datos reales en entornos compartidos sin revisar su configuración. El acceso a datos pasa por el servidor autenticado y las tablas privadas usan RLS.

Si necesitas cambiar el passcode, genera un nuevo `IRATI_PASSCODE_HASH`. Si rotas `SESSION_SECRET`, las sesiones activas dejarán de ser válidas.

## Documentación

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md): contexto técnico estable.
- [`docs/spec.md`](docs/spec.md): especificación funcional y técnica viva.
- [`docs/roadmap.md`](docs/roadmap.md): hitos y alcance.
- [`docs/database-schema.md`](docs/database-schema.md): esquema de datos.
- [`docs/vaccine-calendar.md`](docs/vaccine-calendar.md): calendario inicial de vacunas.
- [`docs/offline-plan.md`](docs/offline-plan.md): evolución del soporte offline.

## Ayuda y cambios

Para una duda o cambio, revisa primero la especificación y el roadmap. Mantén los cambios acotados, actualiza la documentación cuando cambie una decisión estable y usa commits en inglés con Conventional Commits.
