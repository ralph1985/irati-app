# Esquema de base de datos

Este documento describe el esquema inicial de Supabase para Irati. La migracion base esta en `supabase/migrations/20260717163000_initial_schema.sql`, con correcciones posteriores documentadas en `supabase/migrations/`.

Proyecto remoto:

- Nombre: `Irati`
- Ref: `hbnyumafehpbplupucar`
- Region: `eu-west-1`

## Decisiones

- Supabase es persistencia principal.
- Supabase Auth queda desactivado en el MVP; el acceso compartido por passcode vive en la capa Next.js.
- No se activa realtime.
- No se activa storage.
- Las tablas privadas tienen RLS activado desde `supabase/migrations/20260722120000_enable_rls_for_private_tables.sql`.
- No hay politicas para `anon` ni `authenticated`; los accesos de aplicacion deben pasar por servidor con `SUPABASE_SERVICE_ROLE_KEY`.
- Las tablas guardan `created_at` y `updated_at`, aunque `updated_at` se actualizara desde aplicacion o triggers futuros.

## `baby_profiles`

Perfil basico de Irati.

| Campo        | Tipo          | Regla                               |
| ------------ | ------------- | ----------------------------------- |
| `id`         | `uuid`        | Primary key con `gen_random_uuid()` |
| `name`       | `text`        | Obligatorio                         |
| `birth_date` | `date`        | Obligatorio                         |
| `cipa`       | `text`        | Opcional                            |
| `created_at` | `timestamptz` | `now()`                             |
| `updated_at` | `timestamptz` | `now()`                             |

Seed inicial:

- `name`: `Irati`
- `birth_date`: `2026-07-02`
- `cipa`: no se versiona ningun valor real en el repositorio.

## `weight_entries`

Historico de pesos registrados.

| Campo          | Tipo          | Regla                               |
| -------------- | ------------- | ----------------------------------- |
| `id`           | `uuid`        | Primary key                         |
| `measured_on`  | `date`        | Fecha del peso                      |
| `weight_grams` | `integer`     | Entre 1000 y 20000                  |
| `place`        | `text`        | `hospital`, `pediatra` o `farmacia` |
| `notes`        | `text`        | Opcional                            |
| `created_at`   | `timestamptz` | `now()`                             |
| `updated_at`   | `timestamptz` | `now()`                             |

Indice:

- `weight_entries_measured_on_idx`

## `planned_vaccine_doses`

Dosis planificadas del calendario editable.

Seed inicial:

- Migracion: `supabase/migrations/20260718101000_seed_initial_vaccine_calendar.sql`
- Fuente y criterio: `docs/vaccine-calendar.md`
- Fechas calculadas desde el nacimiento de Irati, `2026-07-02`, salvo entradas de campaña que quedan marcadas con notas para revision manual.

| Campo          | Tipo          | Regla       |
| -------------- | ------------- | ----------- |
| `id`           | `uuid`        | Primary key |
| `vaccine_name` | `text`        | Obligatorio |
| `dose_label`   | `text`        | Obligatorio |
| `planned_date` | `date`        | Obligatorio |
| `age_label`    | `text`        | Opcional    |
| `notes`        | `text`        | Opcional    |
| `created_at`   | `timestamptz` | `now()`     |
| `updated_at`   | `timestamptz` | `now()`     |

Indice:

- `planned_vaccine_doses_planned_date_idx`

## `applied_vaccine_doses`

Registro de dosis aplicadas.

| Campo             | Tipo          | Regla                                             |
| ----------------- | ------------- | ------------------------------------------------- |
| `id`              | `uuid`        | Primary key                                       |
| `planned_dose_id` | `uuid`        | Referencia opcional a `planned_vaccine_doses(id)` |
| `applied_on`      | `date`        | Fecha de aplicacion                               |
| `vaccine_name`    | `text`        | Obligatorio                                       |
| `dose_label`      | `text`        | Obligatorio                                       |
| `place`           | `text`        | Texto libre obligatorio                           |
| `lot`             | `text`        | Opcional                                          |
| `notes`           | `text`        | Opcional                                          |
| `created_at`      | `timestamptz` | `now()`                                           |
| `updated_at`      | `timestamptz` | `now()`                                           |

Indices:

- `applied_vaccine_doses_planned_dose_id_idx`
- `applied_vaccine_doses_applied_on_idx`
- `applied_vaccine_doses_planned_dose_id_unique`, unico parcial para evitar mas de una aplicacion vinculada a la misma dosis planificada.

## `developer_backup_runs`

Registro tecnico de las copias locales de Supabase.

Migracion: `supabase/migrations/20260718133000_create_developer_backup_runs.sql`.

| Campo             | Tipo          | Regla                                      |
| ----------------- | ------------- | ------------------------------------------ |
| `id`              | `uuid`        | Primary key                                |
| `started_at`      | `timestamptz` | Inicio de la copia                         |
| `finished_at`     | `timestamptz` | Fin de la copia                            |
| `status`          | `text`        | `success` o `failed`                       |
| `file_name`       | `text`        | Nombre del archivo local si existe         |
| `file_size_bytes` | `bigint`      | Tamaño del archivo si existe               |
| `sha256`          | `text`        | Hash SHA-256 del archivo si existe         |
| `duration_ms`     | `integer`     | Duracion de la ejecucion                   |
| `retained_count`  | `integer`     | Copias locales retenidas tras la ejecucion |
| `error_message`   | `text`        | Error resumido si falla                    |
| `created_at`      | `timestamptz` | `now()`                                    |

Indice:

- `developer_backup_runs_created_at_idx`

La tabla no contiene datos familiares funcionales, solo salud de backup. La app la lee desde servidor con `SUPABASE_SERVICE_ROLE_KEY`.

## `travel_checklist_items`

Checklist reutilizable para preparar salidas y viajes de Irati.

Migracion: `supabase/migrations/20260718160000_create_travel_checklist_items.sql`.

| Campo        | Tipo          | Regla                                                                      |
| ------------ | ------------- | -------------------------------------------------------------------------- |
| `id`         | `uuid`        | Primary key                                                                |
| `label`      | `text`        | Obligatorio                                                                |
| `category`   | `text`        | `comida`, `higiene`, `cambio`, `sueno`, `salud`, `paseo` o `documentacion` |
| `sort_order` | `integer`     | Orden dentro de la categoria                                               |
| `is_packed`  | `boolean`     | `false` por defecto                                                        |
| `notes`      | `text`        | Opcional                                                                   |
| `created_at` | `timestamptz` | `now()`                                                                    |
| `updated_at` | `timestamptz` | `now()`                                                                    |

Indices:

- `travel_checklist_items_category_order_idx`
- `travel_checklist_items_is_packed_idx`

Seed inicial:

- La migracion crea una lista inicial editable para comida, higiene, cambio, sueño, salud, paseo y documentacion.
