# Contrato HTTP/JSON de Innovation Hub — version 1

Contrato del servidor del avance 2. Base `/api`; JSON UTF-8; identificadores opacos de tipo string, independientes de ObjectId. La URL del servidor la configura el cliente mediante `VITE_API_URL`. El contrato debe revisarse en equipo antes de marcar `entrega-2` y conservarse al reimplementar el servidor final.

## Convenciones

- Sesion: cookie firmada `innovation.sid`, HttpOnly, SameSite=Lax, ocho horas, persistida en MongoDB. HTTPS y Secure en produccion. El cliente envia `credentials: 'include'`. Desarrollo: usar `localhost` tanto en React como en la API. La identidad nunca se recibe desde un selector, body o parametro de filtro.
- `CLIENT_ORIGIN` es el origen exacto permitido con credenciales. Otros Origin reciben 403; herramientas locales sin Origin pueden utilizar la API. Si hay un proxy HTTPS, debe configurarse expresamente su confianza antes de desplegar; no se presupone un proxy.
- Cuerpo maximo: 32 KiB. Se rechazan campos no declarados en los cuerpos editables y filtros desconocidos. JSON malformado: 400; cuerpo demasiado grande: 413; limite de intentos de autenticacion: 429.
- Error: `{ "error": { "code": "VALIDATION_ERROR", "message": "Revise los campos indicados.", "fields": { "titulo": "Escriba entre 5 y 80 caracteres." } } }`. `fields` siempre es un objeto; no se garantiza acumular todos los errores de una peticion. El cliente puede corregirlos y reenviar.
- Codigos: 200 consulta/edicion/archivo; 201 creacion; 204 eliminacion/retiro/logout sin cuerpo; 400 formato o validacion; 401 sesion ausente/invalida o credenciales incorrectas; 403 actor/origen prohibido; 404 inexistente o deliberadamente oculto; 409 conflicto de negocio o indice unico; 500 fallo interno sin trazas ni errores de base de datos.
- Listas: `{ "items": [], "total": 0, "page": 1, "size": 10, "totalPages": 1 }`. `page` entero 1..1000000; `size` entero 1..100. Pagina fuera de rango conserva `page` y entrega `items: []`. Conteo y pagina aplican los mismos filtros en MongoDB; dos lecturas simultaneas del listado no constituyen una instantanea transaccional.
- Fechas de calendario: `YYYY-MM-DD` real. Instantes: ISO 8601 UTC. Textos recortados, salvo contrasenas; arreglos sin duplicados. Estados son codigos, no etiquetas de presentacion.

## Usuarios y autenticacion

| Metodo y ruta | Peticion / sesion | Respuesta y fallos adicionales |
| --- | --- | --- |
| POST `/auth/register` | Sin sesion. Registro descrito abajo. | 201 perfil propio y nueva cookie; 400 datos; 409 correo duplicado. |
| POST `/auth/login` | Sin sesion. `{correo,contrasena}` | 200 perfil propio y cookie regenerada; 400 formato; 401 credenciales incorrectas/cuenta inactiva/inexistente. |
| GET `/auth/me` | Sesion obligatoria | 200 perfil propio; 401 sin cuenta activa. |
| POST `/auth/logout` | Sesion obligatoria; sin body | 204; destruye sesion en MongoDB e invalida la cookie aun si alguien conservo una copia. |
| GET `/users?q=&skill=&career=&available=&sort=&page=&size=` | Sesion obligatoria | 200 lista de perfiles publicos; 400 filtros. `available=true|false`; `sort=nombre-asc|nombre-desc`, predeterminado ascendente. |
| GET `/users/{id}` | Sesion obligatoria | 200 perfil; 404 inexistente/inactivo. Correo solo para el titular. |
| PUT `/users/{id}` | Sesion del titular. Perfil editable descrito abajo. | 200 perfil propio; 400 datos/correo/campos protegidos; 403 ajeno; 404 inexistente. |

Registro obligatorio: `{nombre,primerApellido,correo,contrasena,confirmacionContrasena,tipoMiembro,carrera,aceptaTerminos}`; `segundoApellido` opcional. Nombre/apellidos 1..100; segundo apellido 0..100; correo con formato valido, 3..254, normalizado a minusculas y unico; contrasena 8..128 y confirmacion identica; `tipoMiembro=estudiante|docente|administrativo`; carrera 1..150; `aceptaTerminos=true`. No hay registro publico de administradores. El servidor asigna ID, fecha y cuenta activa.

Perfil publico: `{id,nombre,primerApellido,segundoApellido,tipoMiembro,rol,carrera,descripcion,disponible,competencias,intereses,portafolio,fechaModificacion}`. `rol` conserva el campo usado por React y equivale a tipoMiembro. El perfil propio agrega `correo`. Ninguna respuesta devuelve hash, contrasena, sesion interna o configuracion sensible.

PUT requiere `{nombre,carrera,disponible,competencias,intereses}`. Opcionales: primerApellido, segundoApellido, descripcion (0..1000), portafolio (vacio o URL HTTPS, hasta 300). `disponible` booleano real. Competencias: nombres/IDs existentes en `/skills`, hasta 30, sin duplicados. Intereses: hasta 30 textos de 1..100. ID, correo, tipoMiembro, activo y terminos no se modifican en esta ruta. La desactivacion de cuentas y el mantenimiento avanzado de competencias no agregan endpoints fuera del alcance del avance 2.

## Catalogos

| Metodo y ruta | Peticion | Respuesta |
| --- | --- | --- |
| GET `/skills?q=&page=&size=` | Sesion; busqueda literal por nombre | 200 lista `{id,nombre,categoria}`; 400 filtros; 401 sin sesion. |
| GET `/skills/{id}` | Sesion; ID codificado con encodeURIComponent | 200 elemento; 404 inexistente. |
| GET `/categories?q=&page=&size=` | Sesion; busqueda literal por nombre | 200 lista `{id,nombre,categoria:null}`; 400 filtros; 401 sin sesion. |
| GET `/categories/{id}` | Sesion | 200 elemento; 404 inexistente. |

Los IDs de competencias/categorias son sus nombres controlados. Permiten reutilizar los arreglos de strings del cliente sin depender de ObjectId. Se incluyen las ocho categorias iniciales del documento general y se conservan Salud, Medio ambiente, Gestion comunitaria y Emprendimiento como valores heredados del cliente. Los valores exactos, con tildes, se obtienen del catalogo.

## Iniciativas

| Metodo y ruta | Peticion | Respuesta / reglas |
| --- | --- | --- |
| GET `/initiatives?type=&category=&skill=&q=&page=&size=` | Publico segun visibilidad. Filtros adicionales abajo. | 200 lista de iniciativas proyectadas segun acceso; 400 filtros; 401 scope sin sesion. |
| GET `/initiatives/{id}` | Sesion opcional | 200 detalle o resumen restringido; 404 inexistente/no visible. |
| POST `/initiatives` | Sesion; formulario de iniciativa | 201 detalle propio; 400 datos/catalogos; 401 sin sesion. |
| PUT `/initiatives/{id}` | Sesion del propietario; formulario completo | 200 detalle; 403 ajeno; 404 inexistente; 409 archivada o cupos menores al equipo actual. |
| DELETE `/initiatives/{id}` | Sesion del propietario; sin body | 204 si se elimina sin relaciones; 200 `{accion:'archivada',id}` si existen solicitudes de cualquier estado, otro miembro, retiros o proyecto; 403 ajeno; 404 inexistente; 409 ya archivada. |
| PATCH `/initiatives/{id}/archive` | Sesion del propietario; sin body | 200 `{accion:'archivada',id}`; archivo explicito incluso sin relaciones; 403/404/409. |

Formulario: `{titulo,tipo,resumen,descripcion,problema,beneficiarios,categoria,competencias,participantesEstimados,visibilidad,etiquetas}`. Limites conservados del cliente: titulo 5..80, resumen 20..200, descripcion 30..1000, problema 15..500, beneficiarios 3..150. `tipo=Idea|Necesidad|Reto`; categoria existente; 1..30 competencias existentes, sin duplicados; participantes entero 1..50 incluyendo al propietario; etiquetas 0..5 de 1..20. Visibilidad exactamente una de las definidas abajo. El servidor asigna propietario, equipo inicial, fechas y estado `Publicada`.

Filtros combinables: `scope=accessible|owned` exige sesion; sin scope permite catalogo publico. `status` usa un estado de iniciativa; `owner` ID de propietario; `visibility` nivel permitido; `spaces=true|false` compara cupos y miembros. `q` busca literalmente titulo, resumen y etiquetas (sin distinguir mayusculas; no normaliza tildes). Orden `sort=id-asc|titulo-asc|titulo-desc|fecha-asc|fecha-desc`; predeterminado id-asc, desempate por ID. `owned` incluye borradores y archivos propios; en el catalogo general los archivos solo son visibles al equipo y los borradores exclusivamente al autor.

Resumen: `{id,titulo,tipo,resumen,categoria,competencias,estado,propietarioId,visibilidad,accesoCompleto,permisos}`. Detalle autorizado agrega `{descripcion,problema,beneficiarios,participantesEstimados,etiquetas,autor,equipo,integrantesActuales,espaciosDisponibles,fechaPublicacion,fechaCreacion,fechaModificacion}`. Equipo de detalle: `{usuarioId,nombre,rol,fechaIncorporacion}`.

Permisos: `{puedeEditar,puedeArchivar,puedeSolicitar,puedeVerEquipo,puedeConvertir,faltaMiembroParaConvertir}`. Son ayudas para React; cada endpoint vuelve a comprobarlos. Una iniciativa convertida conserva posibilidad de edicion por el propietario mientras no se archive, de acuerdo con el documento general; no admite nuevas solicitudes o conversiones.

### Visibilidad y estados

| Codigo | Visitante | Usuario ajeno autenticado | Propietario / miembro |
| --- | --- | --- | --- |
| publica | Completa | Completa | Completa |
| institucional | 404 y fuera del catalogo | Completa | Completa |
| restringida | 404 y fuera del catalogo | Solo resumen, sin descripcion/problema/equipo | Completa |
| privada | 404 y fuera del catalogo | 404 y fuera del catalogo | Completa |

Estados de iniciativa: `Borrador`, `Publicada`, `En formación de equipo`, `Convertida`, `Archivada`. `Convertida` es el codigo de la etiqueta «Convertida en proyecto» del documento general para conservar compatibilidad con las condiciones existentes en React. Borradores y archivos tienen las restricciones adicionales ya descritas. El propietario automatico no se considera «otro miembro» al decidir si puede eliminarse una iniciativa inicial; en caso contrario nunca seria posible la eliminacion permitida por el enunciado.

## Solicitudes y equipos

| Metodo y ruta | Peticion | Respuesta / reglas |
| --- | --- | --- |
| GET `/requests?scope=mine&status=&initiativeId=&skill=&role=&date=&page=&size=` | Sesion. scope mine/received, predeterminado mine. date YYYY-MM-DD UTC. | 200 lista; received solo iniciativas del propietario; 400 filtros; 401 sesion. Orden fechaCreacion DESC, id ASC. |
| GET `/requests/{id}` | Sesion del solicitante o propietario | 200 solicitud; 403 ajeno; 404 inexistente. |
| POST `/initiatives/{id}/requests` | Sesion; formulario de solicitud | 201 pendiente propia; 400 datos; 403 iniciativa sin acceso; 404 inexistente; 409 propietario/miembro/pendiente duplicada/estado cerrado. |
| PUT `/requests/{id}` | Sesion del solicitante; formulario de solicitud | 200; 403 ajena; 404 inexistente; 409 no pendiente. Conserva identidad, iniciativa y fecha original. |
| PATCH `/requests/{id}/status` | `{estado,respuesta?}` | 200 solicitud. Solicitante cancela; propietario acepta/rechaza. 400 estado; 403 actor; 404 inexistente; 409 no pendiente, aceptacion sin cupo, miembro duplicado, cuenta inactiva o iniciativa cerrada. |
| GET `/initiatives/{id}/team` | Sesion y acceso completo al origen | 200 `{iniciativa,miembros,puedeRetirar}`; 403 sin acceso completo; 404 inexistente. |
| DELETE `/initiatives/{id}/team/{usuarioId}` | Sesion del propietario; sin body | 204; 403 actor; 404 iniciativa/miembro; 409 retiro del propietario. Conserva historial del retiro. |

Formulario de solicitud: `{mensaje,competencias,disponibilidad,rolSolicitado?}`. Mensaje 1..2000, competencias 1..30 de catalogo sin duplicados, disponibilidad 1..300, rol 1..100. Se mantiene `competencias` como arreglo por compatibilidad con Gustavo; el primer elemento es la competencia principal ofrecida. `rolSolicitado` predeterminado `Colaborador` permite operar el formulario actual; la pantalla puede enviar el rol explicito en la integracion.

Solicitud: `{id,iniciativaId,iniciativa,solicitanteId,solicitanteNombre,mensaje,competencias,disponibilidad,rolSolicitado,estado,fechaCreacion,fechaDecision,respuesta}`. Estado `pendiente|aceptada|rechazada|cancelada`; solo transiciones pendiente -> aceptada/rechazada/cancelada. `respuesta` 0..2000, solo decision del propietario. Nueva solicitud tras rechazo/cancelacion permitida si no pertenece al equipo y la iniciativa admite solicitudes. La aceptacion agrega al miembro y registra la decision en una transaccion; no existe alta manual de integrantes.

La referencia `iniciativa` dentro de solicitudes, equipos y proyectos usa `{id,titulo,tipo,resumen,categoria,competencias,estado,propietarioId,visibilidad}`. Una solicitud propia historica cuya iniciativa ya no es visible entrega una referencia neutral `{id,titulo:'Iniciativa no disponible',estado:'No disponible',propietarioId:'no-disponible'}`; conserva el mensaje propio sin divulgar el contenido privado de la iniciativa.

Cada miembro de `/team`: `{usuarioId,nombre,carrera,competencias,rol,fechaIncorporacion}`. Solo propietario puede retirar; no puede retirarse el mismo. Se registra fecha de retiro. No se agrega mantenimiento de roles ni filtros de equipos del alcance final a estos endpoints.

## Proyectos

| Metodo y ruta | Peticion | Respuesta / reglas |
| --- | --- | --- |
| POST `/initiatives/{id}/projects` | Sesion del propietario; formulario de proyecto | 201 proyecto; 400 datos; 403 actor; 404 iniciativa; 409 sin otro miembro, archivada/borrador/convertida o conversion duplicada. |
| GET `/projects?page=&size=` | Sesion; sin otros filtros en este avance | 200 lista accesible; 400 paginacion; 401 sesion. Orden id ASC. |
| GET `/projects/{id}` | Sesion y acceso completo a la iniciativa | 200 proyecto; 404 inexistente/no visible. |

Formulario: `{nombre,descripcion,objetivo,fechaInicio,estado?,repositorio?,tecnologias?,fechaFinEstimada?}`. Nombre 1..150, descripcion 1..4000, objetivo 1..2000; fechaInicio real. Estado predeterminado `planificado`; codigos `planificado|en_progreso|pausado|finalizado|archivado`, etiquetas Planificacion/En desarrollo/Pausado/Finalizado/Archivado. Se acepta el estado del formulario del avance 2; el documento especifico exige recogerlo. Tecnologias 0..30 de 1..100; cierre estimado nulo o fecha >= inicio. Repositorio nulo o `https://github.com/owner/repo`, sin credenciales, consulta o fragmento.

Proyecto: `{id,iniciativaId,iniciativa,nombre,descripcion,objetivo,fechaInicio,estado,repositorio,tecnologias,fechaFinEstimada,fechaCreacion}`. Propiedad, miembros y visibilidad se resuelven desde la iniciativa original; no se duplican de manera que el acceso quede desactualizado. Conversion unica y atomica, con otro miembro ademas del autor. La iniciativa original permanece.

GitHub se consume desde React, tal como exige este avance; el servidor solo valida y almacena su URL. Modificacion, archivado, busqueda y filtrado de proyectos corresponden al alcance final.

## Integracion del cliente (D7)

El cliente principal consume este contrato con cookies: autenticacion, perfiles, catalogos, iniciativas y participacion. App.jsx integra las pantallas de solicitudes, equipos y proyectos con rutas privadas; recupera la sesion al recargar y ejecuta logout por HTTP. Registro, visibilidades, categorias, competencias, formularios y paginacion se ajustan a los formatos documentados. La eliminacion maneja tanto 204 como el archivo informado mediante 200.

La entrada de demostracion de Gustavo permanece separada y solo puede simular en desarrollo. Para configurar y comprobar el recorrido contra MongoDB, consulte [integracion-cliente.md](integracion-cliente.md). Las pruebas del cliente con respuestas controladas no sustituyen ese recorrido ni acreditan las pruebas del servidor.

La numeracion RN del PDF del avance 2 difiere del documento general: por ejemplo, conversion aparece como RN-09 en el avance y RN-17 en el general. La implementacion se guia por el texto de cada regla: correo unico, propietario unico y activo, un nivel de visibilidad, edicion y archivo exclusivos del autor, conservacion del historial, sin pendientes ni miembros duplicados, aceptacion atomica y conversion unica con otro miembro. Esta nota evita atribuir una regla al numero equivocado.
