# Modelo MongoDB del avance 2

Los identificadores son strings opacos; no se expone ObjectId en el contrato. Las fechas generadas se conservan como Date y se serializan ISO UTC. Cada documento registra fechaCreacion y fechaModificacion.

| Coleccion / modelo | Informacion | Relaciones y motivo |
| --- | --- | --- |
| usuarios / Usuario | Nombre, apellidos, correo unico normalizado, tipoMiembro, carrera, descripcion, disponibilidad, intereses, portafolio, activo y hash scrypt excluido de consultas ordinarias. | Competencias por referencia al catalogo; intereses embebidos porque no tienen vida independiente. Ninguna respuesta serializa directamente el documento privado. |
| competencias / Competencia | ID igual a nombre controlado y categoria de competencia. | Referenciada desde usuarios e iniciativas para compartir vocabulario sin duplicar el catalogo. |
| categorias / Categoria | ID igual a nombre controlado. | Referenciada desde cada iniciativa; facilita validar categorias y migrarlas a tabla. |
| iniciativas / Iniciativa | Campos de idea/necesidad/reto, propietarioId, visibilidad, estado, capacidad, etiquetas y revision. | Propietario por referencia a Usuario: exactamente uno. Competencias y categoria por referencia. Etiquetas embebidas por pertenecer solo a la iniciativa. Equipo embebido con usuarioId referenciado, rol y fechaIncorporacion; permite comprobar duplicados y cupos en el documento que se bloquea al aceptar o convertir. Retiros embebidos conservan usuarioId y fechaRetiro. |
| solicitudes / Solicitud | Mensaje, competencias ofrecidas, disponibilidad, rol solicitado, estado, respuesta y fechas. | Referencias a iniciativa y solicitante; coleccion independiente porque crece y mantiene su propio historial, filtros y paginacion. No duplica nombres ni descripcion de la iniciativa. |
| proyectos / Proyecto | Nombre, objetivo, descripcion, fechaInicio, estado, URL GitHub, tecnologias y cierre estimado. | Referencia unica a Iniciativa; propiedad, equipo y visibilidad se resuelven desde ella. Conserva el problema original y evita permisos desactualizados. |
| sesiones | ID firmado de sesion y usuarioId; expiracion de ocho horas. | Almacen tecnico de express-session/connect-mongo. Permite destruir el acceso en logout; cookie no contiene perfiles ni credenciales. TTL limpia sesiones caducadas; la expiracion tambien se verifica al leerlas. |

## Indices e invariantes

- Usuario.correo unico: dos registros simultaneos no crean la misma cuenta.
- Solicitud `(iniciativaId,solicitanteId)` unico parcial para estado pendiente: puede existir historial terminal y solo una pendiente actual.
- Proyecto.iniciativaId unico: una iniciativa genera como maximo un proyecto.
- Indices de usuarios por activo/disponible/nombre y por competencias; iniciativas por propietario, visibilidad/estado, equipo y competencias/categoria; solicitudes por solicitante/fecha y por iniciativa/estado/fecha. Los listados usan sort, skip y limit; las uniones autorizadas de recibidas/proyectos se paginan mediante aggregate + facet.
- Las busquedas literales con regex y algunos filtros combinados pueden requerir recorrer documentos; la paginacion evita transferirlos completos, pero no sustituye futuros indices de busqueda para grandes volumenes.
- Propietario se agrega automaticamente al equipo. Ningun endpoint acepta un propietario arbitrario desde el body. Cada operacion usa la identidad obtenida de una sesion activa.
- Aceptar, retirar, editar capacidad, archivar/eliminar, crear solicitud y convertir escriben una revision de la misma iniciativa dentro de una transaccion. Esto serializa operaciones relacionadas y evita carreras como comprobar un integrante y convertir mientras otra peticion lo retira.
- Aceptacion y alta del miembro se confirman juntas; proyecto y estado Convertida se confirman juntos. Ante fallo se revierte toda la transaccion.

## MongoDB debe ser un replica set

Una instancia independiente no admite estas transacciones. El arranque consulta `hello` y rechaza configuraciones que no puedan garantizar atomicidad. Desarrollo puede usar un replica set de un solo nodo; produccion puede usar un cluster compatible. Las pruebas levantan un MongoDB 7.0.14 temporal real con replica set, no un arreglo en memoria que sustituya las reglas.

## Eliminacion y archivo

Solo se elimina fisicamente una iniciativa sin solicitudes de ningun estado, sin miembros adicionales, sin retiros historicos y sin proyecto. El propietario automatico no bloquea la eliminacion inicial. Si existe cualquier relacion se archiva y conserva todo el historial. Las iniciativas convertidas nunca se borran porque tienen un proyecto referenciado. Las solicitudes canceladas/rechazadas permanecen; retirar un miembro conserva trazabilidad.

## Migracion al servidor final

Usuarios, competencias, categorias, iniciativas, solicitudes y proyectos se convierten en tablas; competencias de usuario/iniciativa y equipo se convierten en tablas de relacion. Los retiros pasan a historial de membresia. Transacciones e indices unicos mantienen las mismas invariantes; DTOs y rutas permanecen iguales. Embebido es una decision de persistencia interna, no una dependencia impuesta a React.
