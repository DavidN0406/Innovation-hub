# Colección de API - G8

Importar `participacion.postman_collection.json` en Postman. Es una propuesta que coincide con `docs/api-participacion-propuesta.md`; no es evidencia de ejecución del servidor. Actualmente `servidor/` no contiene una API ejecutable. Las pruebas del simulador (`cd cliente`, `npm test`) son comprobaciones separadas y no sustituyen esta colección.

## Preparación del servidor y datos

1. Confirmar contrato y mecanismo de autenticación con el equipo. Esta colección propone cookies de sesión y desactiva el cookie jar por petición para que los casos sin autorización sean reproducibles. El cliente real usa `credentials: include`.
2. Levantar API y MongoDB de **pruebas** con los scripts que incorpore el responsable del servidor. No ejecutar sobre datos que deban conservarse.
3. Crear sesiones para propietario, solicitante y ajeno con el acceso real. Completar las variables `cookiePropietario`, `cookieSolicitante` y `cookieAjeno` con `nombreCookie=valor`. No guardar cookies reales en Git. No se inventa una ruta de login mientras no haya contrato general.
4. Completar todos los IDs de la colección con registros reales. `idInexistente` debe ser un ID sintácticamente válido que no exista.

## Datos requeridos (independientes)

| Variable | Preparación |
| --- | --- |
| iniciativaPublicaId | Pública, abierta, solicitante fuera del equipo y sin pendiente previa. Para crear/editar/cancelar. |
| iniciativaPropiaId | Del propietario, con pendientes de aceptación/rechazo y un miembro retirable. |
| solicitudAceptarId / solicitanteAceptarId | Pendiente de iniciativaPropiaId y su solicitante, aún fuera del equipo. |
| solicitudRechazarId | Otra pendiente de iniciativaPropiaId. |
| solicitudPendienteId | Tercera pendiente para pruebas de estado inválido/permisos. |
| solicitudAjenaId | Solicitud que no pertenece al usuario de cookieAjeno. |
| propietarioId / miembroRetirableId | Propietario y otro integrante de iniciativaPropiaId. No usar solicitanteAceptarId como miembroRetirableId. |
| iniciativaConvertirId | Otra iniciativa del mismo propietario, no archivada ni convertida, con otro integrante. |
| iniciativaSinMiembrosId | Otra iniciativa del mismo propietario, solo él en su equipo. |

## Ejecución y evidencias

Ejecutar la colección completa en orden con Collection Runner. Los IDs creados se capturan para los siguientes casos. Los datos de aceptación, retiro y conversión se consumen: restaurar las semillas antes de repetir. Verifica 200, 201, 204, 400, 401, 403, 404 y 409; el 500 debe evaluarse mediante fallos controlados del servidor, no provocando fallas en producción.

Guardar el reporte de ejecución sin cookies/secretos en `pruebas/evidencias/` cuando exista el servidor y anotar fecha, commit, MongoDB, casos aprobados y fallos. Pendiente: ejecutar contra API real, agregar los recursos de usuarios/autenticación/competencias e iniciativas CRUD cuando su contrato esté acordado. Esta colección cubre el alcance asignado a Gustavo y la consulta auxiliar de iniciativas.

Regeneración (sin dependencias): `node herramientas/generar-coleccion.mjs` desde la raíz. No modifica datos del servidor.
