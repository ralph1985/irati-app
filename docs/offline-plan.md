# Plan Offline Progresivo

Este documento guia la incorporacion de modo offline en Irati sin romper la app actual. El trabajo debe hacerse por fases pequeñas, con validacion al cerrar cada fase y manteniendo Supabase remoto como fuente principal.

## Objetivo

- Permitir que la PWA instalada abra y muestre la ultima copia disponible cuando no haya conexion.
- Permitir escritura offline solo cuando la fase anterior este estable.
- Empezar la escritura offline por Peso, porque sus conflictos son mas simples que Vacunas.
- Mantener el comportamiento online actual despues de cada fase.

## Limites

- No se implementa todo el offline de golpe.
- No se introduce realtime.
- No se introducen push notifications.
- No se introducen cuentas separadas.
- No se introduce Supabase local ni Docker como dependencia del flujo.
- No se exponen datos privados antes de autenticar.
- No se mueve `SUPABASE_SERVICE_ROLE_KEY` al cliente.

## Principios De Seguridad

- El primer acceso por dispositivo requiere conexion y sesion valida.
- IndexedDB solo puede hidratarse despues de una sesion valida.
- Las escrituras remotas siguen pasando por servidor autenticado.
- El logout debe limpiar o invalidar la copia local.
- La UI debe mostrar cuando los datos son locales, antiguos, pendientes de sincronizar o tienen error.
- Los datos familiares persistidos en el dispositivo son un riesgo aceptado solo si queda explicito antes de implementar.

## Estado Actual

- Irati es una PWA instalable, pero los datos requieren conexion.
- Las pantallas principales leen datos desde Server Components y repositorios cacheados de servidor.
- Las escrituras usan Server Actions y adaptadores Supabase de servidor.
- La cache actual de Next.js reduce lecturas a Supabase, pero no sirve como offline de navegador.
- El MVP inicial excluyo IndexedDB, cola de sincronizacion y service worker offline.

## Fase 0 - Preparacion

Objetivo: cerrar decisiones tecnicas antes de tocar comportamiento runtime.

Estado: cerrada documentalmente. No instala dependencias ni cambia comportamiento de la app.

Decisiones:

- IndexedDB: usar Dexie como adaptador local, porque da versionado de esquema, transacciones y tablas tipadas sin meter un estado global nuevo.
- Service worker: usar Serwist para Next como estrategia base, manteniendo una configuracion restrictiva. El service worker debe cachear shell, assets y fallback offline, pero no respuestas HTML privadas ni datos familiares.
- Build de Next: ejecutar el build con webpack mientras se use `@serwist/next`, porque Next 16 usa Turbopack por defecto y esta integracion de Serwist no lo soporta.
- Registro del service worker: incorporarlo en una fase posterior con control explicito desde cliente y validacion en PWA instalada.
- Logout: limpiar IndexedDB por defecto. Si la limpieza falla, invalidar el acceso local y mostrar error en Ajustes antes de considerar el dispositivo listo para offline.
- Primer acceso offline: no existe. Cada dispositivo necesita una primera carga online autenticada y una hidratacion local correcta.
- Riesgo de datos locales: se acepta para una PWA familiar instalada, con la condicion de que la copia local solo exista tras login y se limpie en logout.
- Supabase: sigue siendo la fuente remota principal. Las escrituras remotas siguen pasando por servidor autenticado con `SUPABASE_SERVICE_ROLE_KEY`.
- Alcance de Fase 1: solo lectura offline. No se añade cola de mutaciones hasta Fase 2.

Tareas:

- [x] Elegir libreria IndexedDB.
- [x] Elegir estrategia de service worker compatible con Next y Vercel.
- [x] Fijar build con webpack para compatibilidad con `@serwist/next`.
- [x] Definir politica de logout.
- [x] Definir copia local minima por tabla: perfil, pesos, vacunas planificadas, vacunas aplicadas y checklist de viaje.
- [x] Definir metadatos comunes: ultima sincronizacion correcta, version de esquema local y errores pendientes.
- [x] Confirmar explicitamente el tratamiento de datos privados locales.

Gate:

- [x] Documento de decision actualizado.
- [x] Sin cambios de runtime.
- [x] `git diff --check`.

## Fase 1 - Lectura Offline

Objetivo: poder abrir la PWA sin conexion y consultar la ultima copia local.

Estado: implementacion lista. Pendiente de validacion manual en PWA instalada.

Tareas:

- [x] Instalar Dexie y Serwist.
- [x] Crear storage local con tablas para `baby_profiles`, `weight_entries`, `planned_vaccine_doses`, `applied_vaccine_doses`, `travel_checklist_items` y `sync_metadata`.
- [x] Añadir tests del storage local para snapshot vacio, reemplazo completo y limpieza en logout.
- [x] Configurar Serwist con registro manual, fallback offline y cache restrictiva de assets.
- [x] Precachear el fallback `/~offline`.
- [x] Conectar limpieza local al flujo real de logout.
- [x] Hidratar IndexedDB tras una carga online autenticada usando los repositorios existentes.
- [x] Mostrar resumen local en el fallback offline sin cachear HTML privado.
- [x] Mostrar indicador global basico con copia preparada, preparando copia o sin conexion.
- [x] Leer snapshot local cuando la navegacion falla y se muestra el fallback offline.
- [x] Cachear app shell, assets y fallback offline con service worker, sin cachear HTML privado ni respuestas de datos familiares.
- [x] Mostrar estado global completo: `Al dia`, `Sin conexion`, `Datos locales` o `Error al sincronizar`.
- [x] Mostrar ultima sincronizacion en Ajustes.
- [x] Mantener las escrituras online con Server Actions como ahora.

Gate:

- Online funciona igual que antes.
- [x] Online funciona igual que antes.
- [x] Offline sin snapshot muestra una pantalla segura y clara.
- [x] Offline con snapshot muestra un resumen local desde IndexedDB.
- [x] Logout limpia o invalida el snapshot local.
- [x] Checks: `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test`, `pnpm build`.
- [ ] Validacion manual en PWA instalada: cargar online, cerrar, cortar red, reabrir y navegar.

## Fase 2 - Escritura Offline En Peso

Objetivo: crear, editar y borrar pesos sin conexion, y sincronizarlos al recuperar red.

Estado: implementacion lista. Pendiente de validacion manual en PWA instalada.

Tareas:

- [x] Crear cola local `pending_mutations` para Peso con operaciones `create`, `update` y `delete`.
- [x] Usar ids cliente estables e idempotencia para evitar duplicados.
- [x] Aplicar cambios optimistas en IndexedDB.
- [x] Mantener mutaciones fallidas visibles hasta que se sincronicen o retiren.
- [x] Crear endpoint autenticado para aplicar mutaciones de Peso en Supabase con id local idempotente.
- [x] Mostrar pesos pendientes con estado visual propio.
- [x] Enviar operaciones al servidor en orden al recuperar conexion.
- [x] Reconciliar respuesta remota con el snapshot local.
- [x] Mantener operaciones fallidas visibles y reintentables.
- [x] Permitir alta de peso offline desde el formulario de Peso.
- [x] Permitir edicion y borrado de peso offline desde el historico.

Gate:

- [x] Crear peso offline deja el registro visible y pendiente.
- [x] Editar peso offline conserva el ultimo cambio local.
- [x] Borrar peso offline no reaparece al recargar offline.
- [x] Al volver online, los cambios llegan a Supabase una sola vez.
- [x] Si Supabase rechaza una operacion, no se descarta silenciosamente.
- [x] Checks completos.
- [ ] Validacion manual en PWA instalada.

## Fase 3 - Escritura Offline En Viaje

Objetivo: ampliar escritura offline a la checklist de viaje si Peso queda estable.

Tareas:

- Reutilizar la cola local para crear, editar, marcar, borrar y resetear items.
- Definir tratamiento de `sortOrder` offline.
- Reconciliar cambios remotos sin desordenar la lista local.
- Mostrar acciones pendientes y errores por item.

Gate:

- Crear, editar, marcar y borrar items funciona offline.
- Resetear checklist offline queda claramente marcado como accion de alto impacto.
- La lista no duplica items tras reintentos.
- Checks completos y validacion manual en PWA instalada.

## Fase 4 - Escritura Offline En Vacunas

Objetivo: permitir escritura offline en Vacunas solo tras definir conflictos de dominio.

Tareas:

- Diseñar matriz de conflictos antes de implementar.
- Cubrir como minimo: marcar aplicada, editar aplicacion, reabrir dosis y editar planificacion.
- Evitar una regla generica de "ultimo cambio gana" para operaciones semanticas incompatibles.
- Mostrar conflictos que requieran revision manual.

Gate:

- La matriz de conflictos esta documentada y testeada.
- Las operaciones offline no pueden dejar una dosis aplicada y reabierta a la vez.
- Los errores de sincronizacion no ocultan informacion clinica introducida por el usuario.
- Checks completos y validacion manual en PWA instalada.

## Criterios Para Parar O Revertir

- Se expone informacion privada antes de autenticar.
- Una fase rompe el comportamiento online actual.
- Una escritura pendiente puede duplicarse en Supabase.
- Logout deja datos privados accesibles sin decision explicita.
- Vacunas entra en escritura offline sin matriz de conflictos.

## Validacion Documental

Para cambios solo documentales relacionados con este plan:

- Ejecutar `git diff --check`.
- No ejecutar build ni tests completos salvo que tambien cambie codigo.
- Revisar que `docs/spec.md`, `docs/roadmap.md` y este documento no se contradicen.
