# Problemas Conocidos Para Agentes

Este archivo guarda caveats operativos que conviene revisar antes de diagnosticar fallos o cambiar configuracion.

## Entorno Y Build

- Evitar `next/font/google` porque `next build` puede necesitar red para descargar fuentes. Usar fuentes del sistema salvo decisión explícita distinta.
- Operaciones con red, instalacion de dependencias o scaffolds pueden fallar por restricciones del sandbox; si son necesarias, pedir escalado.
- Las escrituras en `.git` pueden necesitar permisos escalados. No interpretar errores de permisos sobre refs, `HEAD` o index como corrupción del repositorio sin más evidencia.

## Supabase Y Backups

- El flujo actual usa Supabase remoto; no insistir en Docker ni Supabase local salvo petición explícita.
- Los backups se generan en `var/backups/supabase/` y no se suben a Git.
- No tocar `.env`, `.env.local`, `SUPABASE_SERVICE_ROLE_KEY`, `IRATI_PASSCODE_HASH` ni `SESSION_SECRET` salvo petición explícita.

## Alcance

- Irati no tiene offline de datos ni realtime en el MVP.
- No introducir cuentas separadas, push notifications, email, exportación para pediatra ni percentiles oficiales sin actualizar antes la especificación viva.
