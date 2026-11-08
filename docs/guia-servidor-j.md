# Guia para comprender los commits J1-J10

Esta guia explica la parte de Jorge. El codigo propio de JavaScript incluye comentarios en espanol junto a las instrucciones: que hacen, por que se necesitan y con que modulo se conectan. Las llaves de cierre y las lineas vacias no llevan comentarios repetitivos. Los archivos JSON no admiten comentarios: su proposito y sus campos se explican aqui y en el contrato. `package-lock.json` lo genera npm para fijar dependencias; no es logica escrita manualmente.

## El recorrido que conviene aprender primero

```text
Componente de React
  -> servicio del cliente: fetch con credentials: include
  -> app.js: origen, JSON, cookie, usuario activo
  -> rutas/: metodo HTTP y parametros
  -> servicios/: validacion y reglas de negocio
  -> datos/: consultas, modelos, indices y transacciones
  -> MongoDB
  -> servicio: respuesta publica sin datos sensibles
  -> ruta: codigo HTTP y JSON
  -> React: muestra resultado o error y actualiza su estado
```

Las rutas describen como entrar; los servicios deciden si se puede hacer; los modelos definen que se guarda. El middleware es una funcion que se ejecuta antes o despues de las rutas para resolver una necesidad compartida, como identificar al usuario o traducir errores.

## J1 — Crear estructura del servidor y documentar contrato

Commit `3fc9334`.

- `servidor/package.json`: dependencias, version de Node y comandos de ejecucion, semillas, analisis y pruebas. Las dependencias instaladas permanecen fuera de Git.
- `servidor/.env.example`: nombres de variables y explicaciones; no contiene un secreto utilizable. `.env` es privado.
- `servidor/src/configuracion.js`: carga y valida URI, puerto, origen permitido y secreto. Una configuracion incorrecta se detecta antes de abrir HTTP.
- `servidor/src/app.js`: construye Express y monta sus capas en orden. No abre el puerto, lo que permite probarlo sin arrancar una segunda aplicacion diferente.
- `servidor/src/index.js`: punto de arranque. Lee configuracion, espera MongoDB e indices, crea la app y abre el puerto.
- `servidor/src/middleware/errores.js`: define ErrorHttp y exigir. Un servicio puede rechazar una regla sin repetir la construccion del JSON de error en cada ruta.
- `docs/api-contract.md`: acuerdo de rutas, campos, codigos, filtros, estados, visibilidad y errores. No utiliza detalles de MongoDB que obliguen a modificar React en el servidor final.

Ejemplo: `GET /api/no-existe` termina en el middleware de rutas desconocidas, crea un ErrorHttp 404 y el ultimo middleware responde `{error:{code,message,fields}}`.

## J2 — Configurar MongoDB y modelos del sistema

Commit `d1f6345`.

- `datos/conexion.js`: una conexion compartida, limite de espera y verificacion de replica set.
- `datos/modelos.js`: Usuario, Competencia, Categoria, Iniciativa, Solicitud y Proyecto. Define tipos, fechas, referencias, equipo embebido e indices.
- `datos/catalogos.js`: tipos, visibilidades, estados y valores iniciales controlados.
- `datos/repositorio.js`: consultarUno, insertar, paginar, transaccion, bloquearIniciativa y paginarAgregado. Son operaciones reutilizables de acceso a datos.
- `docs/modelo-datos.md`: explica por que el equipo esta embebido y las solicitudes estan en una coleccion separada, y como migrar esas decisiones a tablas.

Una referencia guarda el ID de otro documento. Por ejemplo, Proyecto.iniciativaId apunta al problema original. Un embebido guarda informacion dentro del documento propietario: equipo pertenece a una iniciativa, pero cada usuarioId sigue apuntando a un perfil real.

Un indice unico es una regla de la propia base: incluso si dos peticiones pasan la misma comprobacion casi al mismo tiempo, MongoDB rechaza el duplicado. Por eso el chequeo del servicio no reemplaza al indice.

## J3 — Implementar registro y autenticacion segura

Commit `0ee7af2`.

Leer en este orden: `rutas/autenticacion.js` -> `servicios/autenticacion.js` -> `servicios/contrasenas.js` -> `middleware/sesion.js`.

1. POST `/auth/register` valida los campos del registro, confirmacion de contrasena y terminos.
2. El correo se recorta y normaliza a minusculas. El indice unico evita duplicados simultaneos.
3. Scrypt combina la contrasena con una sal aleatoria y calcula un hash. La sal no es una contrasena; hace que dos claves iguales tengan representaciones distintas.
4. Se guarda el hash, nunca la contrasena ni su confirmacion.
5. establecerSesion regenera el identificador, guarda usuarioId en MongoDB y envia una cookie firmada HttpOnly.
6. perfilPublico selecciona lo que puede responderse: no serializa el documento privado completo.

En login se vuelve a calcular la derivacion y se compara en tiempo constante. El error es el mismo para correo inexistente, cuenta inactiva y clave incorrecta.

En cada peticion cargarActor consulta si esa sesion sigue perteneciendo a un usuario activo. exigirSesion responde 401 cuando falta identidad valida. Logout destruye la sesion de MongoDB: borrar solo el estado de React no seria suficiente porque una cookie copiada seguiria funcionando.

## J4 — Implementar perfiles, competencias y consultas de usuarios

Commit `1c15ac9`.

Leer `rutas/usuarios.js`, `servicios/usuarios.js` y `rutas/catalogos.js`.

PUT `/users/{id}` compara el ID solicitado con el usuario de la cookie. Solo despues acepta campos de una lista blanca: nombre, carrera, disponibilidad, competencias, intereses y campos opcionales del perfil. Correo, rol, ID y estado de cuenta no se pueden cambiar desde este formulario.

validarCompetencias comprueba que cada nombre exista en MongoDB. No basta recibir un arreglo de textos: una referencia a una competencia inventada tambien seria un error.

GET `/users?q=Ana&skill=React&career=Software&available=true&page=1&size=10` combina los criterios en MongoDB. La pagina usa sort, skip y limit; countDocuments usa el mismo filtro para informar el total. React recibe una pagina, no todos los usuarios para filtrarlos en el navegador.

Las consultas ajenas omiten correo. El titular recibe su correo para verlo en el perfil, pero no para editarlo.

## J5 — Implementar gestion completa de iniciativas

Commit `bbfdaf4`.

Leer `servicios/permisos.js` antes de `servicios/iniciativas.js`. Alli estan las decisiones comunes: esPropietario, esMiembro, puedeExplorar, puedeVerCompleta y filtroVisible.

- Publica: visitante o usuario pueden ver el detalle.
- Institucional: requiere una cuenta autenticada.
- Restringida: el usuario ajeno autenticado ve el resumen permitido; descripcion, problema y equipo solo llegan al autor o miembros.
- Privada: solo autor y miembros; se oculta a otros incluso conociendo su ID.

El servidor retira los campos antes de enviarlos. Ocultarlos con CSS o con un boton no protegeria la API.

Crear asigna automaticamente propietario y primera membresia desde la sesion. Editar conserva ese propietario y la fecha original; no puede reducir cupos por debajo de los integrantes actuales.

EliminarOArchivar verifica solicitudes de cualquier estado, proyecto, otros miembros y retiros. Sin historial elimina y responde 204. Con historial cambia a Archivada y responde 200 con la accion realizada. Las solicitudes canceladas tambien cuentan como historial.

## J6 — Implementar solicitudes del participante

Commit `6f356a5`.

Leer `rutas/solicitudes.js` y `servicios/solicitudes.js`.

1. Un usuario envia mensaje, competencias y disponibilidad a POST `/initiatives/{id}/requests`.
2. El servicio valida el cuerpo, acceso a la iniciativa y estado; no permite que propietario o miembros soliciten ingresar otra vez.
3. Comprueba que no haya otra pendiente y MongoDB refuerza la regla con un indice unico parcial.
4. El servidor asigna solicitanteId, iniciativaId, fecha y estado pendiente.
5. PUT permite cambios solo al solicitante y mientras siga pendiente.
6. PATCH de estado permite cancelar una pendiente propia; conserva el documento para trazabilidad.

GET `/requests?scope=mine` obtiene la identidad de la cookie. No se puede pedir la lista privada de otra persona cambiando un usuarioId en la URL.

## J7 — Implementar solicitudes recibidas y equipos

Commit `749e3f5`.

GET `/requests?scope=received` une solicitudes con iniciativas dentro de MongoDB y conserva solo las del propietario autenticado antes de contar y paginar.

Aceptar es el ejemplo principal para comprender las transacciones:

1. Recupera la solicitud y bloquea la iniciativa mediante una escritura de revision.
2. Comprueba que el actor sea el propietario, que la solicitud siga pendiente, que la iniciativa este abierta y haya cupo.
3. Verifica que el usuario este activo y no pertenezca al equipo.
4. Agrega al equipo el usuario con su rol y fecha de incorporacion.
5. Marca la solicitud aceptada y registra la fecha de decision.
6. Confirma ambas escrituras juntas. Si falla una, se revierten las dos.

Rechazar conserva la solicitud sin agregar miembros. Los estados terminales no se vuelven a abrir.

`servicios/equipos.js` entrega nombres, carrera, competencias, rol y fecha solo cuando existe acceso completo al origen. Retirar exige propietario, impide que se retire a si mismo y registra el historial del retiro.

## J8 — Implementar conversion y consulta de proyectos

Commit `2c66caa`.

Leer `rutas/proyectos.js` y `servicios/proyectos.js`.

Convertir verifica en MongoDB otro integrante ademas del autor y ausencia de proyecto anterior. Una transaccion crea Proyecto.iniciativaId y cambia el estado del origen a Convertida. No se borra la iniciativa.

La revision compartida ordena conversion frente a retiros simultaneos: la conversion solo puede ganar si verifico el miembro en la secuencia confirmada de escrituras. Si el retiro se confirmo primero y ya no queda otro miembro, responde 409.

El proyecto toma visibilidad del origen en cada consulta. Si una iniciativa publica cambia a privada, un proyecto anterior no sigue exponiendo sus datos a terceros. El listado aplica esa misma politica antes de paginar.

GitHub sigue siendo consultado desde React por el servicio existente de Gustavo. El servidor valida y guarda la URL; no duplica ese consumo ni incorpora tokens al navegador.

## J9 — Agregar carga de datos de prueba

Commit `08a03bf`.

`datos/semillas.js` crea catalogos y actores reproducibles. `src/semillas.js` es la entrada del comando `npm run seed -- --confirmar-demo`. Exige una base `_demo`, clave externa y confirmacion; evita sobrescribir escenarios ya convertidos de forma inconsistente.

Los escenarios separan crear/cancelar, aceptar, rechazar, retirar y convertir. No se usa el mismo recurso para todos los casos porque una prueba podria consumir el estado que otra necesita.

## J10 — Completar validaciones y documentacion del servidor

Consultar el hash con `git log -1 --oneline` al finalizar esta entrega.

`servidor/pruebas/api.test.js` ejecuta 17 escenarios sobre Express y un MongoDB temporal real. Incluye las dos colecciones Postman: 38 casos originales y 27 adicionales. No utiliza la base del archivo .env ni registra las cookies en Git.

`npm run lint` revisa sintaxis, variables/importaciones sin uso y otros problemas sin ejecutar las reglas del negocio. Se configura para fallar tambien ante advertencias. `node --check` se utilizo para comprobar la sintaxis de cada archivo propio durante la preparacion de los commits. `git diff --check` verifica errores de formato en las diferencias.

La revision manual complementa las herramientas: comprueba si los permisos corresponden al documento, si las respuestas filtran informacion, si se preservan relaciones y si dos peticiones simultaneas podrian romper invariantes. Pasar lint no demuestra que una regla de negocio sea correcta; por eso existen pruebas funcionales y de concurrencia.

## Como ver y explicar tus cambios en VS Code

1. Abrir la carpeta `D:\Proyecto Progra Web\Innovation-hub` completa.
2. Activar numeros de linea en Ver -> Apariencia -> Numeros de linea, o buscar «Line Numbers» en Configuracion y elegir on.
3. En Control de codigo fuente, abrir el grafico del historial y seleccionar un commit J para ver sus archivos y diferencias.
4. Desde la terminal usar `git show --stat HASH` para el resumen y `git show HASH -- servidor/src/ARCHIVO.js` para el detalle de un archivo.
5. Para todo tu aporte: `git diff 86339f4..HEAD -- servidor docs pruebas/servidor.postman_collection.json README.md`.

Los signos + muestran lo agregado y - lo retirado. El numero de linea ubica el fragmento; el comentario explica la instruccion y esta guia explica el flujo que la contiene. La revision inicial se hizo leyendo los archivos del repositorio y comparando el contrato con las funciones de los servicios del cliente; no se uso una captura para adivinar su contenido.

## Lo que sigue siendo integracion de equipo

El codigo de `cliente/` y `avance1/` queda igual al estado recibido. En ese estado, autenticacion/perfiles/iniciativas usan simulacion y App.jsx tiene rutas de participacion pendientes. D7 debe conectar la sesion real, los servicios y la navegacion. Servidor aprobado y cliente compilado no significan que ese recorrido integrado ya este completado.

Antes de marcar entrega-2, practicar con el equipo el recorrido completo desde las pantallas reales y resolver las diferencias de formularios y estados documentadas en el contrato. La guia ayuda a estudiar, pero cada integrante debe poder localizar, explicar y modificar el codigo por su cuenta.
