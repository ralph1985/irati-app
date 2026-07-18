# Roadmap de Irati

Irati es una aplicacion privada para Rafa y Begoña orientada al seguimiento de peso y vacunas. El desarrollo seguira Spec Driven Development: antes de implementar cambios relevantes, la especificacion viva de [`docs/spec.md`](spec.md) debe reflejar el comportamiento esperado.

## Principios

- Mobile first.
- PWA instalable desde el inicio.
- Requiere conexion en el MVP.
- Sin modo offline de datos.
- Sin realtime.
- Cuenta compartida mediante PIN/passcode con seguridad real de servidor.
- Supabase como fuente principal de datos.
- Next.js en la ultima version estable verificada al inicializar el proyecto.
- pnpm como gestor de paquetes.
- Vercel como destino de despliegue.
- Arquitectura hexagonal desde el inicio, sin sobreingenieria.
- Diseño familiar, suave y luminoso, con morado como color principal.
- Hitos pequeños, verificables y documentados.
- Tests basicos al principio; ampliar cobertura cuando crezca el riesgo.

## Inspiracion revisada

### Zoey Tracker

Ideas utiles:

- Pantallas orientadas a decisiones familiares reales, no solo a tablas de datos.
- Resumen inicial con el estado importante del dia.
- Seguimiento de peso con historico y grafica.
- Perfil del bebe como dato base que alimenta calculos y planificaciones.
- App privada con acceso compartido para el hogar.
- Distincion clara entre datos registrados y datos derivados o estimados.

No se copia:

- Backend FastAPI + SQLite.
- Seguimiento amplio de tomas, pañales, medicacion, informes y vitales.
- Push notifications en el MVP.
- Percentiles o referencias clinicas en la primera grafica de peso.

### Jucart

Ideas utiles:

- Desarrollo incremental por hitos con checklist.
- App privada para Rafa y Begoña, con alcance deliberadamente pequeño.
- PWA mobile first.
- Supabase remoto como persistencia personal.
- Feedback visible cuando se guarda o sincroniza.
- Documentacion de decisiones tecnicas y esquema de datos.

No se copia:

- Dexie/IndexedDB como fallback offline.
- Realtime de Supabase.
- Tablero de una sola pantalla propio de lista de la compra.
- Logica de multi-dispositivo con refresco realtime.

## Hito 0 - Definicion inicial

- [x] Definir objetivo inicial: seguimiento de peso y vacunas.
- [x] Definir usuarios: Rafa y Begoña.
- [x] Definir acceso inicial: una cuenta compartida.
- [x] Definir nacimiento de Irati: 02/07/2026.
- [x] Definir peso: fecha, peso en gramos y lugar.
- [x] Definir lugares de peso iniciales: Pediatra y Farmacia.
- [x] Definir vacunas: aplicadas y planificacion.
- [x] Definir calendario de referencia: Comunidad de Madrid.
- [x] Definir que los datos iniciales del calendario seran editables.
- [x] Definir avisos internos de proximas vacunas.
- [x] Definir PWA desde el inicio.
- [x] Definir que no habra modo offline de datos ni realtime en el MVP.
- [x] Definir PIN/passcode con seguridad real.
- [x] Definir grafica simple de peso con filtro por lugar.
- [x] Definir estados de vacuna: pendiente, proxima, aplicada y retrasada.
- [x] Definir regla inicial de avisos: proxima en 14 dias o menos; retrasada si la fecha planificada ya paso.
- [x] Definir datos de vacuna aplicada: fecha, vacuna, dosis, lugar, lote y notas.
- [x] Dejar exportacion/impresion para pediatra fuera del MVP.
- [x] Crear `docs/roadmap.md`.
- [x] Crear `docs/spec.md`.

## Hito 1 - Definicion UX inicial

- [x] Definir tono de producto: app familiar.
- [x] Definir navegacion principal: menu inferior.
- [x] Definir pestañas iniciales: Inicio, Peso, Vacunas y Ajustes.
- [x] Definir Inicio: Irati y edad, avisos, ultimo peso, acciones rapidas y resumen.
- [x] Definir paleta: suave y luminosa con morado como color principal.
- [x] Definir tarjetas redondeadas y suaves para bloques principales.
- [x] Definir acciones destacadas en las pantallas principales.
- [x] Definir Peso: grafica arriba e historial debajo.
- [x] Definir Vacunas con toggle de vista.
- [x] Definir vista por defecto de Vacunas: por estado.
- [x] Definir orden de estados: retrasadas, proximas, pendientes y aplicadas.
- [x] Definir linea temporal de vacunas organizada por edad.
- [x] Definir Ajustes como pantalla minima al principio.
- [x] Definir edicion del calendario dentro de Vacunas.
- [x] Definir formularios como modal/bottom sheet.
- [x] Definir que las vacunas retrasadas destaquen dentro de la paleta morada.
- [x] Actualizar `docs/spec.md` con las decisiones UX.

## Hito 2 - Inicializacion tecnica

- [x] Crear proyecto Next.js con TypeScript usando la ultima version estable.
- [x] Configurar pnpm.
- [x] Configurar ESLint.
- [x] Configurar Prettier.
- [x] Configurar testing basico.
- [x] Configurar estructura inicial de arquitectura hexagonal.
- [x] Crear una pantalla minima con el nombre Irati.
- [x] Configurar PWA instalable desde el inicio.
- [x] Añadir manifest, metadata e iconos provisionales.
- [x] Preparar variables de entorno de ejemplo.
- [x] Verificar typecheck, lint, tests y build.

## Hito 3 - Seguridad de acceso

- [x] Definir el contrato de autenticacion por PIN/passcode en `docs/spec.md`.
- [x] Crear hashing del PIN en servidor.
- [x] Crear login por passcode.
- [x] Crear sesion segura mediante cookie HttpOnly.
- [x] Configurar `Secure`, `SameSite` y expiracion de sesion.
- [x] Añadir rate limit basico contra intentos fallidos.
- [x] Impedir cargar datos privados antes de autenticar.
- [x] Añadir logout.
- [x] Añadir tests basicos de login, sesion y bloqueo.

## Hito 4 - Supabase y modelo base

- [x] Crear proyecto Supabase remoto.
- [x] Añadir Supabase CLI al proyecto.
- [x] Configurar link al proyecto remoto.
- [x] Crear migraciones iniciales.
- [x] Crear tabla de perfil de Irati.
- [x] Guardar nombre y fecha de nacimiento.
- [x] Crear tabla de pesos.
- [x] Crear tabla de vacunas planificadas.
- [x] Crear tabla de vacunas aplicadas o campos equivalentes segun diseño final.
- [x] Documentar esquema en `docs/database-schema.md`.
- [x] Aplicar migraciones en Supabase remoto.
- [x] Añadir tests basicos de adaptadores.

## Hito 5 - Perfil de Irati

- [x] Mostrar perfil basico de Irati.
- [x] Guardar fecha de nacimiento `2026-07-02`.
- [ ] Permitir editar datos basicos si fuera necesario.
- [x] Usar la fecha de nacimiento para calcular planificaciones futuras.
- [x] Añadir validaciones basicas.
- [x] Añadir tests del caso de uso de perfil.

## Hito 6 - Registro de peso

- [x] Definir entidad de peso en dominio.
- [x] Registrar peso con fecha, gramos y lugar.
- [x] Restringir lugar a Hospital, Pediatra o Farmacia.
- [x] Listar historico de pesos.
- [x] Editar una entrada de peso.
- [x] Borrar una entrada de peso con confirmacion.
- [x] Validar que el peso sea numerico y razonable.
- [x] Mostrar estado de carga y error.
- [x] Añadir tests basicos de dominio, caso de uso y componente.

## Hito 7 - Grafica de peso

- [x] Mostrar linea simple con la evolucion del peso.
- [x] Filtrar la grafica por Todos, Farmacia o Pediatra.
- [x] Mantener el listado coherente con el filtro elegido, si aporta claridad.
- [x] Mostrar estado vacio cuando no haya datos para el filtro.
- [x] Evitar percentiles o referencias clinicas en este hito.
- [x] Añadir tests basicos de filtrado y renderizado.

## Hito 8 - Calendario inicial de vacunas

- [x] Buscar y verificar la fuente oficial vigente de la Comunidad de Madrid.
- [x] Documentar la fuente y fecha de verificacion.
- [x] Traducir el calendario a datos iniciales editables.
- [x] Crear seed o migracion de dosis planificadas.
- [x] Calcular fechas planificadas desde el nacimiento de Irati.
- [x] Permitir editar dosis planificadas.
- [x] Mantener claro que los datos pueden necesitar revision manual.
- [x] Añadir tests basicos de calculo de fechas y carga inicial.

## Hito 9 - Vacunas planificadas y estados

- [x] Mostrar vacunas planificadas.
- [x] Calcular estado pendiente.
- [x] Calcular estado proxima si faltan 14 dias o menos.
- [x] Calcular estado retrasada si la fecha planificada ya paso y no esta aplicada.
- [x] Mostrar estado aplicada cuando exista fecha real de aplicacion.
- [x] Ordenar por fecha planificada.
- [x] Mostrar resumen de proximas y retrasadas.
- [x] Añadir tests basicos de estados.

## Hito 10 - Registro de vacunas aplicadas

- [x] Marcar una dosis planificada como aplicada.
- [x] Registrar fecha de aplicacion.
- [x] Registrar vacuna.
- [x] Registrar dosis.
- [x] Registrar lugar como texto libre.
- [x] Registrar lote.
- [x] Registrar notas.
- [x] Permitir editar datos de aplicacion.
- [x] Permitir volver una vacuna a pendiente con confirmacion.
- [x] Añadir tests basicos del flujo aplicado/pendiente.

## Hito 11 - Avisos internos

- [x] Mostrar avisos dentro de la app para vacunas proximas.
- [x] Mostrar avisos dentro de la app para vacunas retrasadas.
- [x] Evitar email, push y notificaciones externas en el MVP.
- [x] Hacer que los avisos sean visibles en la pantalla inicial.
- [x] Añadir tests basicos de avisos.

## Hito 12 - Pulido del MVP

- [x] Revisar usabilidad movil.
- [x] Revisar accesibilidad basica.
- [x] Revisar estados vacios.
- [x] Revisar errores de conexion.
- [x] Revisar textos visibles.
- [x] Crear pantalla minima de Ajustes.
- [x] Revisar instalacion PWA.
- [x] Ejecutar typecheck, lint, tests y build.
- [x] Actualizar `docs/spec.md`.
- [x] Actualizar `docs/roadmap.md`.

## Hito 13 - Copias de seguridad

- [x] Definir el contrato de backups en `docs/spec.md`.
- [x] Crear tabla tecnica `developer_backup_runs`.
- [x] Crear script de export remoto de Supabase sin Docker.
- [x] Guardar copias locales en `var/backups/supabase/`.
- [x] Mantener copias y logs fuera de Git.
- [x] Añadir retencion local configurable.
- [x] Añadir instalador de cron cada 6 horas.
- [x] Registrar metadata de exito o fallo de cada ejecucion.
- [x] Mostrar salud de backup en Ajustes.
- [x] Aplicar migracion en Supabase remoto.
- [x] Instalar cron en el usuario local.
- [x] Ejecutar una primera copia y verificar metadata.
- [x] Ejecutar typecheck, lint, tests y build.

## Fuera del MVP inicial

- Exportacion o impresion para pediatra.
- Percentiles oficiales o curvas clinicas.
- Modo offline de datos.
- Realtime.
- Multiusuario con cuentas separadas.
- Permisos por rol.
- Notificaciones push.
- Email.
- Compartir acceso con familiares.
- Seguimiento de tomas, pañales, sueño u otros hitos.
