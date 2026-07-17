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
- El esquema inicial no incluye RLS porque el MVP no expone Supabase directamente al cliente; los accesos deben pasar por servidor.
- Las tablas guardan `created_at` y `updated_at`, aunque `updated_at` se actualizara desde aplicacion o triggers futuros.

## `baby_profiles`

Perfil basico de Irati.

| Campo        | Tipo          | Regla                               |
| ------------ | ------------- | ----------------------------------- |
| `id`         | `uuid`        | Primary key con `gen_random_uuid()` |
| `name`       | `text`        | Obligatorio                         |
| `birth_date` | `date`        | Obligatorio                         |
| `created_at` | `timestamptz` | `now()`                             |
| `updated_at` | `timestamptz` | `now()`                             |

Seed inicial:

- `name`: `Irati`
- `birth_date`: `2026-07-02`

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
