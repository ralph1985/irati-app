# Calendario inicial de vacunas

Este documento registra la fuente y la traduccion inicial a datos editables para el Hito 8.

## Fuente verificada

- Fuente principal: Comunidad de Madrid, `Calendario de vacunacion / inmunizacion a lo largo de toda la vida. Año 2026 (Cartel)`.
- Ref. PublicaMadrid: `51768`.
- URL: `https://www.comunidad.madrid/publicacion/ref/51768`.
- Fuente tecnica de apoyo: Comunidad de Madrid, `Calendario de vacunacion e inmunizacion para toda la vida 2026 (Documento tecnico)`.
- Ref. PublicaMadrid: `51747`.
- URL: `https://www.comunidad.madrid/publicacion/ref/51747`.
- Fecha de verificacion para este proyecto: `2026-07-18`.

## Criterio de traduccion

El calendario oficial lista antigenos por edad. Para que la app sea util en casa, las dosis iniciales se cargan como citas editables agrupadas cuando corresponde a una vacuna combinada:

- `Hexavalente (DTPa-VPI-Hib-HB)` agrupa DTPa, VPI, Hib y hepatitis B a los 2, 4 y 11 meses.
- `Tetraviral (SRPV)` agrupa triple virica y varicela a los 3 años.
- Las dosis de neumococo, meningococo, rotavirus, varicela, VPH, gripe y recuerdos se cargan como entradas propias.

Las fechas se calculan desde el nacimiento de Irati, `2026-07-02`, salvo entradas de campaña:

- VRS se carga como `2026-10-01` para revisar cita de campaña de otoño 2026.
- Gripe se carga al cumplir 6 meses, `2027-01-02`, con nota de confirmar fecha exacta de campaña.

Estos datos no sustituyen la revision profesional. La pantalla de Vacunas permite editar vacuna, dosis, fecha, edad y notas.
