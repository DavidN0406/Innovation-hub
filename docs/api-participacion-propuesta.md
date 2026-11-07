# Propuesta de contrato: solicitudes, equipos y proyectos

Estado: propuesta para integrar con el equipo. No existe contrato general en `docs/` al iniciar G1. No congela el contrato final ni implementa el servidor. Las RN-05 a RN-08 completas deben cotejarse con el documento general del proyecto, aún no disponible.

Base: `VITE_API_URL` (incluye `/api`). HTTP/JSON, IDs opacos como cadenas; fechas de calendario `YYYY-MM-DD`, instantes ISO 8601 UTC. Autenticación propuesta: cookie de sesión HttpOnly, `credentials: include`; la identidad la obtiene el servidor, nunca del body ni de un selector. CORS debe permitir exclusivamente el origen configurado del cliente con credenciales. Confirmar con el responsable del servidor antes de congelar.

Error uniforme: `{ "error": { "code": "VALIDATION_ERROR", "message": "Revise los campos indicados.", "fields": { "nombre": "Obligatorio." } } }`. `fields` es un objeto campo → mensaje. Todas las rutas requieren sesión: 401 si falta o expiró, 403 si carece de permisos, 404 si el recurso no existe/no es visible, 500 para fallo interno sin trazas. Validación 400, conflicto de negocio 409. Cada escritura se valida y autoriza nuevamente en el servidor.

Listas: `{items:[],total:0,page:1,size:10,totalPages:1}`. `page` entero >=1, `size` entero 1..100 (10 predeterminado); orden solicitudes `fechaCreacion DESC,id ASC`, iniciativas `id ASC`, proyectos `id ASC`. Página fuera de rango devuelve `items:[]` sin alterar el número solicitado.

| Método y ruta | Petición | Respuesta / reglas |
| --- | --- | --- |
| GET `/initiatives?scope=accessible&page=1&size=10` | scope `accessible` o `owned` | 200 lista de resúmenes accesibles/propios. Resumen `{id,titulo,estado,propietarioId}`; el contrato general puede agregar campos. |
| GET `/requests?scope=mine&status=&initiativeId=&page=1&size=10` | scope `mine` o `received`; status opcional | 200 lista; `received` solo iniciativas del propietario autenticado, `mine` solo solicitudes propias. Filtros combinados en servidor; 400 filtros inválidos. |
| POST `/initiatives/{id}/requests` | `{mensaje,competencias,disponibilidad}` | 201 solicitud; 400 campos; 403 iniciativa sin acceso; 404 iniciativa; 409 propietario/miembro, pendiente duplicada, iniciativa archivada/convertida. |
| PUT `/requests/{id}` | `{mensaje,competencias,disponibilidad}` | 200 solicitud; solo solicitante y pendiente; 400 campos, 403 ajena, 404 inexistente, 409 no pendiente. |
| PATCH `/requests/{id}/status` | `{estado}` | 200 solicitud; solicitante cancela, propietario acepta/rechaza; 400 estado, 403 actor, 404 inexistente, 409 no pendiente/miembro duplicado/iniciativa cerrada al aceptar. Aceptación y alta al equipo deben ser atómicas. |
| GET `/initiatives/{id}/team` | sin body | 200 `{iniciativa,miembros:[{usuarioId,nombre,rol}],puedeRetirar:boolean}`; 403 sin acceso; 404 iniciativa. |
| DELETE `/initiatives/{id}/team/{usuarioId}` | sin body | 204 vacío; solo propietario; 403 actor, 404 iniciativa/miembro, 409 retiro del propietario. |
| POST `/initiatives/{id}/projects` | `{nombre,descripcion,objetivo,fechaInicio,estado,repositorio}` | 201 proyecto; solo propietario; 400 campos, 403 actor, 404 iniciativa, 409 sin otro integrante/archivada/conversión duplicada. Conversión única y atómica. |
| GET `/projects?page=1&size=10` | sin body | 200 lista de proyectos accesibles; 400 paginación. |
| GET `/projects/{id}` | sin body | 200 proyecto; 404 inexistente/no visible. |

Solicitud: `{id,iniciativaId,iniciativa,solicitanteId,solicitanteNombre,mensaje,competencias,disponibilidad,estado,fechaCreacion}`. Estado: `pendiente|aceptada|rechazada|cancelada`. Mensaje recortado 1..2000 caracteres, competencias arreglo no vacío de cadenas 1..100 (sin duplicados), disponibilidad 1..300. Los campos de identidad, estado inicial y fecha se asignan en el servidor. Pendiente admite edición y transiciones a aceptada/rechazada/cancelada; estas son terminales. Se propone permitir una nueva solicitud tras rechazo/cancelación si no pertenece al equipo; confirmar con RN completas.

Proyecto: `{id,iniciativaId,iniciativa,nombre,descripcion,objetivo,fechaInicio,estado,repositorio}`. Nombre 1..150, descripción 1..4000, objetivo 1..2000; fecha real; estado `planificado|en_progreso|finalizado`; repositorio `null` o URL HTTPS `https://github.com/owner/repo` sin credenciales, query ni fragmento. Referencia a iniciativa permanece al convertir. Se propone marcar iniciativa `Convertida`; confirmar estado con contrato general.

Visibilidad: la simulación solo reutiliza los niveles presentes en los datos actuales (`publica`, `restringida`); propietario/miembros acceden al equipo y proyectos restringidos. Los cuatro niveles de RN-03 deben definirse en el contrato general y aplicarse en el servidor. No presentar esta simulación como cumplimiento de persistencia, autenticación o autorización real.
