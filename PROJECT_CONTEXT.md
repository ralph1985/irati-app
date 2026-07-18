# PROJECT_CONTEXT.md

Irati es una aplicación privada para Rafa y Begoña orientada al seguimiento de peso y vacunas de Irati. La aplicación debe ser rápida de usar en móvil, instalable como PWA y segura antes de mostrar datos familiares.

## Arquitectura Principal

- `src/app/`: rutas y layouts de Next.js App Router.
- `src/app/(app)/`: zona privada autenticada con Inicio, Peso, Vacunas y Ajustes.
- `src/app/login/route.ts` y `src/app/logout/route.ts`: superficie HTTP de autenticación.
- `src/modules/auth`: passcode, sesión, cookies y rate limit.
- `src/modules/profile`: perfil básico de Irati.
- `src/modules/weight`: entradas de peso, filtros, grafica e historial.
- `src/modules/vaccines`: calendario planificado, estados, avisos y aplicación de dosis.
- `src/modules/backup`: lectura de salud de backups.
- `src/shared/infrastructure/supabase`: cliente de servidor y tipos de base de datos.
- `supabase/migrations`: esquema versionado y seeds iniciales.
- `scripts`: utilidades de hash de passcode, backup remoto y cron.

## Producto

El MVP incluye perfil básico, peso, vacunas, avisos internos, PWA instalable, passcode compartido y Supabase remoto como persistencia principal.

Fuera del MVP: offline de datos, realtime, email, push notifications, percentiles oficiales, exportación para pediatra, cuentas separadas y acceso familiar de solo lectura.

La especificación viva es `docs/spec.md`. El estado de hitos vive en `docs/roadmap.md`.

## Seguridad Y Datos

La app no debe exponer datos privados antes de autenticar.

- El passcode se valida en servidor contra `IRATI_PASSCODE_HASH`.
- La sesión usa cookie HttpOnly `irati_session` firmada con `SESSION_SECRET`.
- El rate limit inicial de login es en memoria por IP.
- No se deben imprimir tokens, claves de Supabase ni secretos de entorno.
- Supabase remoto es la fuente principal; no usar Docker ni Supabase local por defecto.

## Supabase Y Backups

Las migraciones versionadas viven en `supabase/migrations/*.sql`.

El backup local automatizable se ejecuta contra Supabase remoto:

```bash
pnpm backup:supabase
```

Los archivos generados viven en `var/backups/supabase/` y no se suben a Git. Ajustes muestra salud de backup y avisa si la última copia correcta supera el umbral definido en la especificación.

## Desarrollo

Comandos principales:

```bash
pnpm typecheck
pnpm lint
pnpm format
pnpm test
pnpm build
```

Evitar `next/font/google` en este entorno porque el build puede depender de red. Usar fuentes del sistema salvo decisión explícita distinta.
