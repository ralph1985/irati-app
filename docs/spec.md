# Especificacion viva de Irati

Este documento es la fuente de verdad funcional y tecnica de Irati. Debe actualizarse antes o durante cada hito cuando cambien decisiones, reglas de dominio, datos o criterios de aceptacion.

## Vision

Irati es una aplicacion privada para Rafa y Begoña que empieza con seguimiento de peso y vacunas. El objetivo del MVP es responder de forma rapida a dos preguntas:

- Como evoluciona el peso de Irati.
- Que vacunas estan pendientes, proximas, aplicadas o retrasadas.

## Alcance del MVP

Incluido:

- Perfil basico de Irati.
- Fecha de nacimiento: 02/07/2026.
- Acceso con PIN/passcode compartido y seguridad real de servidor.
- PWA instalable desde el inicio.
- Estilo visual familiar, suave y luminoso, con morado como color principal.
- Navegacion inferior con Inicio, Peso, Vacunas y Ajustes.
- Registro de peso.
- Grafica simple de peso.
- Filtro de peso por lugar.
- Planificacion editable de vacunas.
- Registro de vacunas aplicadas.
- Estados de vacunas.
- Avisos internos de proximas y retrasadas.
- Supabase como persistencia principal.
- Despliegue en Vercel.

Backups:

- El MVP incluye copia local automatizable de Supabase porque los datos familiares dependen de un servicio remoto.
- La copia se hace contra Supabase remoto, sin Docker ni Supabase local.
- `pnpm backup:supabase` genera un archivo `irati-supabase-<timestamp>.sql.tar.gz` en `var/backups/supabase/`.
- El archivo contiene `schema.sql`, `data.sql` y `manifest.txt`.
- `schema.sql` concatena las migraciones versionadas del repositorio.
- `data.sql` contiene los datos actuales de `baby_profiles`, `planned_vaccine_doses`, `weight_entries`, `applied_vaccine_doses` y `developer_backup_runs`.
- Los archivos generados y logs viven en `var/` y no se suben a Git.
- La retencion local por defecto es de 14 dias, configurable con `IRATI_SUPABASE_BACKUP_RETENTION_DAYS`.
- `pnpm backup:supabase:cron:install` instala un cron cada 6 horas por defecto.
- La frecuencia puede cambiarse con `IRATI_SUPABASE_BACKUP_CRON_SCHEDULE`.
- Cada ejecucion registra metadata tecnica en `developer_backup_runs`.
- Ajustes muestra la salud de backup y avisa si la ultima copia correcta tiene mas de 6 horas.
- Las variables requeridas son `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

Excluido:

- Modo offline de datos.
- Realtime.
- Email.
- Push notifications.
- Exportacion o impresion para pediatra.
- Percentiles oficiales.
- Cuentas separadas para Rafa y Begoña.
- Acceso familiar de solo lectura.
- Seguimiento de sueño, tomas, pañales u otros hitos.

## Usuarios

### Rafa y Begoña

Usan una unica cuenta compartida protegida por PIN/passcode. En el MVP ambos tienen el mismo acceso y no se registra autoria por persona.

## Seguridad

La app no debe exponer datos privados antes de autenticar.

Requisitos iniciales:

- PIN/passcode compartido.
- El PIN no se guarda en claro.
- El servidor valida el PIN contra un hash.
- La sesion se guarda en cookie HttpOnly.
- La cookie debe usar configuracion segura para produccion.
- Debe existir rate limit basico para intentos fallidos.
- Debe existir logout.

Contrato de autenticacion:

- El passcode se envia por `POST /login`.
- El hash del passcode vive en `IRATI_PASSCODE_HASH`.
- El formato inicial del hash es `scrypt:v1:N:r:p:salt:hash`, generado con `pnpm auth:hash -- <passcode>`.
- La comparacion del passcode se hace en servidor con comparacion segura.
- La sesion vive en una cookie HttpOnly llamada `irati_session`.
- La cookie se firma con `SESSION_SECRET` mediante HMAC SHA-256.
- La cookie usa `SameSite=Lax`, `Path=/`, expiracion de 30 dias y `Secure` en produccion.
- El logout se hace por `POST /logout` y borra la cookie de sesion.
- En desarrollo y primera version MVP, el rate limit es en memoria por IP: 5 intentos fallidos cada 15 minutos.
- Para Vercel en produccion, si se necesita robustez multi-instancia, el puerto de rate limit debe cambiar a un almacen compartido antes de ampliar acceso.
- La rotacion del passcode se hace cambiando `IRATI_PASSCODE_HASH`.
- La rotacion de `SESSION_SECRET` invalida todas las sesiones activas.

## Plataforma

Stack inicial:

- Next.js 16.2.10, verificada como `latest` estable en npm el 2026-07-17.
- TypeScript.
- pnpm.
- Supabase remoto.
- Supabase CLI 2.109.1.
- `@supabase/supabase-js` 2.110.7.
- Vercel.
- PWA.
- ESLint.
- Prettier.
- Vitest para tests basicos de reglas puras.

PWA:

- La aplicacion debe ser instalable desde el inicio.
- La base incluye manifest, metadata web app, `id`, `scope`, iconos PNG de 192 y 512 px e icono SVG maskable.
- El shell puede cachearse para instalacion y carga basica en un hito posterior si se incorpora service worker.
- Los datos requieren conexion en el MVP.
- No se implementa IndexedDB ni cola de sincronizacion.
- No se implementa realtime.
- No se incorpora service worker offline en el MVP porque la aplicacion requiere conexion.

## Arquitectura

Se usara arquitectura hexagonal con separacion pragmatica:

- Dominio: entidades, value objects y reglas puras.
- Aplicacion: casos de uso.
- Puertos: interfaces para persistencia, autenticacion y reloj.
- Adaptadores: Supabase, cookies/sesion, Next.js handlers/server actions segun convenga.
- UI: componentes y paginas.

Regla:

- La UI no debe contener reglas de dominio importantes.
- Supabase no debe filtrarse como dependencia directa del dominio.
- Las reglas calculables, como estados de vacuna, deben poder probarse sin navegador ni base de datos.

Estructura inicial confirmada al inicializar Next.js:

```txt
src/
  app/
  modules/
    profile/
      domain/
      application/
      infrastructure/
      ui/
    weight/
      domain/
      application/
      infrastructure/
      ui/
    vaccines/
      domain/
      application/
      infrastructure/
      ui/
    auth/
      domain/
      application/
      infrastructure/
      ui/
  shared/
    domain/
    application/
    infrastructure/
    ui/
docs/
  database-schema.md
  roadmap.md
  spec.md
supabase/
  config.toml
  migrations/
```

Scripts de validacion inicial:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm format`

## Dominio

### Perfil de Irati

Datos iniciales:

- Nombre: Irati.
- Fecha de nacimiento: 2026-07-02.

La fecha de nacimiento se usa para calcular la planificacion inicial de vacunas desde el calendario de la Comunidad de Madrid.

El perfil se lee desde Supabase mediante el repositorio de perfil. Si Supabase no devuelve perfil, la app puede mostrar un fallback local temporal con los datos iniciales para evitar una pantalla rota en desarrollo.

### Peso

Una entrada de peso contiene:

- Fecha.
- Peso en gramos.
- Lugar.

Lugares validos iniciales:

- Hospital.
- Pediatra.
- Farmacia.

Reglas:

- El peso se registra en gramos.
- La grafica muestra una linea simple.
- La grafica permite filtrar por Todos, Hospital, Farmacia o Pediatra.
- No se calculan percentiles en el MVP.
- No se mezclan estimaciones con pesos registrados en el MVP.

Criterios de aceptacion:

- Puedo añadir un peso con fecha, gramos y lugar.
- Puedo ver el historico de pesos.
- Puedo editar un peso registrado.
- Puedo borrar un peso registrado con confirmacion.
- Puedo ver una grafica simple con todos los pesos.
- Puedo filtrar la grafica por Farmacia.
- Puedo filtrar la grafica por Pediatra.
- Puedo filtrar la grafica por Hospital.
- Si no hay pesos para un filtro, veo un estado vacio claro.

### Vacunas

La app gestiona vacunas planificadas y vacunas aplicadas.

El calendario inicial del MVP queda basado en estas fuentes y decisiones:

- Fuente principal: Comunidad de Madrid, `Calendario de vacunacion / inmunizacion a lo largo de toda la vida. Año 2026 (Cartel)`, ref. `51768`.
- Fuente tecnica de apoyo: Comunidad de Madrid, `Calendario de vacunacion e inmunizacion para toda la vida 2026 (Documento tecnico)`, ref. `51747`.
- Fecha de verificacion para este proyecto: `2026-07-18`.
- El detalle de traduccion vive en `docs/vaccine-calendar.md`.
- Los datos iniciales se cargan en `planned_vaccine_doses` mediante migracion y son editables desde la pantalla de Vacunas.
- Las fechas se calculan desde el nacimiento de Irati salvo entradas de campaña que requieren revision manual.

Una dosis planificada contiene, como minimo:

- Vacuna.
- Dosis.
- Fecha planificada.
- Estado calculado o derivado.

Una vacuna aplicada contiene:

- Fecha de aplicacion.
- Vacuna.
- Dosis.
- Lugar.
- Lote.
- Notas.

El lugar de vacunacion es texto libre.

Flujo aplicado/pendiente:

- Una dosis planificada puede marcarse como aplicada desde la pantalla de Vacunas.
- Al marcarla como aplicada se registra fecha de aplicacion, vacuna, dosis, lugar, lote y notas.
- La vacuna y la dosis se rellenan desde la dosis planificada, pero pueden editarse en el registro de aplicacion.
- Una aplicacion vinculada a una dosis planificada puede editarse.
- Volver una dosis aplicada a pendiente borra la aplicacion vinculada despues de confirmacion.
- Solo debe existir una aplicacion vinculada por dosis planificada.

Estados:

- Pendiente.
- Proxima.
- Aplicada.
- Retrasada.

Reglas de estado iniciales:

- Aplicada: existe una entrada en `applied_vaccine_doses` vinculada a la dosis planificada.
- Retrasada: no esta aplicada y la fecha planificada es anterior a hoy.
- Proxima: no esta aplicada y la fecha planificada esta entre hoy y los proximos 14 dias.
- Pendiente: no esta aplicada y la fecha planificada queda a mas de 14 dias.
- La pantalla de Vacunas muestra las dosis agrupadas en este orden: retrasadas, proximas, pendientes y aplicadas.
- La pantalla de Vacunas muestra un resumen numerico de retrasadas, proximas, pendientes y aplicadas.

Avisos internos:

- Los avisos internos se derivan de las dosis con estado retrasada o proxima.
- Los avisos se muestran dentro de la app, sin email, push ni notificaciones externas en el MVP.
- La pantalla de Inicio muestra hasta tres avisos de vacunas proximas o retrasadas y enlaza a Vacunas.
- Si no hay vacunas proximas ni retrasadas, Inicio muestra un estado tranquilo.

Pulido MVP:

- La app mantiene foco visible para navegacion por teclado.
- Inicio informa si no puede cargar parte de los datos remotos.
- Los estados vacios de peso, vacunas y avisos deben ser visibles y no bloquear la navegacion.
- El cierre MVP conserva el alcance sin offline, realtime, email ni push.

Criterios de aceptacion:

- Puedo ver vacunas planificadas ordenadas por fecha.
- Puedo editar vacuna, dosis, fecha planificada, edad y notas de una dosis planificada.
- Puedo distinguir pendientes, proximas, aplicadas y retrasadas.
- Puedo marcar una dosis como aplicada.
- Al aplicar una dosis puedo registrar fecha, vacuna, dosis, lugar, lote y notas.
- Puedo editar los datos iniciales del calendario.
- Veo avisos internos cuando hay vacunas proximas.
- Veo avisos internos cuando hay vacunas retrasadas.

## Pantallas iniciales

El MVP debe cubrir estas superficies:

- Bloqueo/login por PIN.
- Inicio/resumen.
- Peso.
- Vacunas.
- Ajustes minimos o perfil.

### Direccion visual

La app debe sentirse familiar, suave y luminosa.

Decisiones:

- Morado como color principal de marca y acciones.
- Fondos claros.
- Tonos suaves.
- Tarjetas redondeadas y amables para avisos, resumenes y bloques principales.
- Mucho cuidado con la legibilidad y la jerarquia visual.
- Las acciones principales deben ser visibles y faciles de tocar.
- Los avisos retrasados deben destacar, pero dentro de la paleta morada.

### Navegacion

La navegacion principal usa menu inferior tipo app movil.

Pestañas iniciales:

- Inicio.
- Peso.
- Vacunas.
- Ajustes.

La estructura puede crecer despues con mas pestañas o menus secundarios, pero el MVP parte de estas cuatro.

### Inicio

El inicio debe priorizar:

- Irati y su edad actual.
- Vacunas retrasadas si existen.
- Vacunas proximas.
- Ultimo peso registrado, con fecha y lugar.
- Acciones rapidas para registrar peso y marcar vacuna aplicada.
- Mini resumen de vacunas pendientes/proximas y total de pesos registrados.

El orden debe favorecer lo accionable: primero lo que requiere atencion, despues el contexto.

### Peso

La pantalla de Peso debe priorizar:

- Grafica de peso arriba.
- Historial debajo.
- Boton de accion destacado para añadir peso.

El ultimo peso se muestra en la pantalla de Inicio, no como elemento dominante de la pantalla de Peso.

### Vacunas

La pantalla de Vacunas debe incluir un toggle de vista.

Vista por defecto:

- Por estado.

Vistas:

- Por estado.
- Linea temporal.

La vista por estado se agrupa en este orden:

- Retrasadas.
- Proximas.
- Pendientes.
- Aplicadas.

La linea temporal se organiza por edad de Irati, no solo por fecha concreta.

La edicion del calendario de vacunas vive inicialmente dentro de Vacunas, no en Ajustes.

### Ajustes

Ajustes sera minima al principio.

Debe cubrir:

- Perfil basico de Irati.
- Sesion/PIN segun el alcance implementado.
- Informacion tecnica basica si es util para desarrollo o soporte.
- La pantalla muestra el perfil basico, el estado del acceso compartido, accion de cerrar sesion e informacion tecnica del MVP.
- La pantalla muestra estado de copias de seguridad: ultima copia correcta, ultimo fallo si existe y aviso si no hay copia correcta reciente.

No debe absorber la gestion completa del calendario de vacunas en el MVP.

### Formularios

Los formularios de añadir o editar peso y vacunas se abren como modal.

En movil, el patron preferido es bottom sheet.

En escritorio se podra adaptar, pero debe conservarse la sensacion de modal y no de pagina independiente.

## Persistencia

Supabase sera la fuente principal.

No se implementa en el MVP:

- Persistencia local con IndexedDB.
- Reintentos offline.
- Conflictos de sincronizacion.
- Subscripciones realtime.

Tablas previstas, pendientes de concretar en `docs/database-schema.md`:

- `app_profile` o equivalente para Irati y configuracion base.
- `weight_entries`.
- `vaccine_plans`.
- `vaccine_applications` o campos de aplicacion en la planificacion.
- Tabla o mecanismo para sesion/rate limit si fuera necesario.

## Testing

Estrategia inicial:

- Tests unitarios basicos de reglas de dominio.
- Tests de casos de uso principales.
- Tests de adaptadores Supabase donde aporten confianza.
- Tests de componentes clave cuando haya UI.
- E2E minimo solo cuando el flujo principal este montado.

No se exige cobertura exhaustiva al inicio. La cobertura debe crecer cuando se añadan mas reglas clinicas, seguridad o flujos criticos.

## Decisiones abiertas

- Duracion de sesion.
- Detalles visuales finos de componentes.
- Libreria de graficas.
- Libreria o estrategia de PWA para Next.js.
- Forma exacta del esquema Supabase.
- Si vacunas planificadas y aplicaciones viven en una o dos tablas.
- Como gestionar cambios manuales sobre calendario inicial.
- Textos exactos de avisos internos.

## Proceso SDD

Antes de implementar un hito:

1. Revisar si `docs/spec.md` cubre el comportamiento.
2. Añadir o ajustar reglas y criterios de aceptacion.
3. Implementar el cambio mas pequeño que cumpla la spec.
4. Añadir tests basicos proporcionales al riesgo.
5. Ejecutar validaciones.
6. Actualizar `docs/roadmap.md` con el estado real.

La spec puede cambiar, pero no debe quedar por detras del producto.
