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

## Hito 1 - Inicializacion tecnica

- [ ] Crear proyecto Next.js con TypeScript usando la ultima version estable.
- [ ] Configurar pnpm.
- [ ] Configurar ESLint.
- [ ] Configurar Prettier.
- [ ] Configurar testing basico.
- [ ] Configurar estructura inicial de arquitectura hexagonal.
- [ ] Crear una pantalla minima con el nombre Irati.
- [ ] Configurar PWA instalable desde el inicio.
- [ ] Añadir manifest, metadata e iconos provisionales.
- [ ] Preparar variables de entorno de ejemplo.
- [ ] Verificar typecheck, lint, tests y build.

## Hito 2 - Seguridad de acceso

- [ ] Definir el contrato de autenticacion por PIN/passcode en `docs/spec.md`.
- [ ] Crear hashing del PIN en servidor.
- [ ] Crear login por passcode.
- [ ] Crear sesion segura mediante cookie HttpOnly.
- [ ] Configurar `Secure`, `SameSite` y expiracion de sesion.
- [ ] Añadir rate limit basico contra intentos fallidos.
- [ ] Impedir cargar datos privados antes de autenticar.
- [ ] Añadir logout.
- [ ] Añadir tests basicos de login, sesion y bloqueo.

## Hito 3 - Supabase y modelo base

- [ ] Crear proyecto Supabase remoto.
- [ ] Añadir Supabase CLI al proyecto.
- [ ] Configurar link al proyecto remoto.
- [ ] Crear migraciones iniciales.
- [ ] Crear tabla de perfil de Irati.
- [ ] Guardar nombre y fecha de nacimiento.
- [ ] Crear tabla de pesos.
- [ ] Crear tabla de vacunas planificadas.
- [ ] Crear tabla de vacunas aplicadas o campos equivalentes segun diseño final.
- [ ] Documentar esquema en `docs/database-schema.md`.
- [ ] Aplicar migraciones en Supabase remoto.
- [ ] Añadir tests basicos de adaptadores.

## Hito 4 - Perfil de Irati

- [ ] Mostrar perfil basico de Irati.
- [ ] Guardar fecha de nacimiento `2026-07-02`.
- [ ] Permitir editar datos basicos si fuera necesario.
- [ ] Usar la fecha de nacimiento para calcular planificaciones futuras.
- [ ] Añadir validaciones basicas.
- [ ] Añadir tests del caso de uso de perfil.

## Hito 5 - Registro de peso

- [ ] Definir entidad de peso en dominio.
- [ ] Registrar peso con fecha, gramos y lugar.
- [ ] Restringir lugar a Pediatra o Farmacia.
- [ ] Listar historico de pesos.
- [ ] Editar una entrada de peso.
- [ ] Borrar una entrada de peso con confirmacion.
- [ ] Validar que el peso sea numerico y razonable.
- [ ] Mostrar estado de carga y error.
- [ ] Añadir tests basicos de dominio, caso de uso y componente.

## Hito 6 - Grafica de peso

- [ ] Mostrar linea simple con la evolucion del peso.
- [ ] Filtrar la grafica por Todos, Farmacia o Pediatra.
- [ ] Mantener el listado coherente con el filtro elegido, si aporta claridad.
- [ ] Mostrar estado vacio cuando no haya datos para el filtro.
- [ ] Evitar percentiles o referencias clinicas en este hito.
- [ ] Añadir tests basicos de filtrado y renderizado.

## Hito 7 - Calendario inicial de vacunas

- [ ] Buscar y verificar la fuente oficial vigente de la Comunidad de Madrid.
- [ ] Documentar la fuente y fecha de verificacion.
- [ ] Traducir el calendario a datos iniciales editables.
- [ ] Crear seed o migracion de dosis planificadas.
- [ ] Calcular fechas planificadas desde el nacimiento de Irati.
- [ ] Permitir editar dosis planificadas.
- [ ] Mantener claro que los datos pueden necesitar revision manual.
- [ ] Añadir tests basicos de calculo de fechas y carga inicial.

## Hito 8 - Vacunas planificadas y estados

- [ ] Mostrar vacunas planificadas.
- [ ] Calcular estado pendiente.
- [ ] Calcular estado proxima si faltan 14 dias o menos.
- [ ] Calcular estado retrasada si la fecha planificada ya paso y no esta aplicada.
- [ ] Mostrar estado aplicada cuando exista fecha real de aplicacion.
- [ ] Ordenar por fecha planificada.
- [ ] Mostrar resumen de proximas y retrasadas.
- [ ] Añadir tests basicos de estados.

## Hito 9 - Registro de vacunas aplicadas

- [ ] Marcar una dosis planificada como aplicada.
- [ ] Registrar fecha de aplicacion.
- [ ] Registrar vacuna.
- [ ] Registrar dosis.
- [ ] Registrar lugar como texto libre.
- [ ] Registrar lote.
- [ ] Registrar notas.
- [ ] Permitir editar datos de aplicacion.
- [ ] Permitir volver una vacuna a pendiente con confirmacion.
- [ ] Añadir tests basicos del flujo aplicado/pendiente.

## Hito 10 - Avisos internos

- [ ] Mostrar avisos dentro de la app para vacunas proximas.
- [ ] Mostrar avisos dentro de la app para vacunas retrasadas.
- [ ] Evitar email, push y notificaciones externas en el MVP.
- [ ] Hacer que los avisos sean visibles en la pantalla inicial.
- [ ] Añadir tests basicos de avisos.

## Hito 11 - Pulido del MVP

- [ ] Revisar usabilidad movil.
- [ ] Revisar accesibilidad basica.
- [ ] Revisar estados vacios.
- [ ] Revisar errores de conexion.
- [ ] Revisar textos visibles.
- [ ] Revisar instalacion PWA.
- [ ] Ejecutar typecheck, lint, tests y build.
- [ ] Actualizar `docs/spec.md`.
- [ ] Actualizar `docs/roadmap.md`.

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
- Backup automatizado.
