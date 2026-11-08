# Revision del servidor J1-J10 — 8 de noviembre de 2026

Base recibida: `86339f4`. Se realizo pull antes de aplicar cambios: Already up to date. Solo se agrega el servidor, documentacion asociada, una coleccion adicional y la actualizacion del README. El codigo de cliente/ y avance1/, y la coleccion original de Gustavo, permanecen sin diferencias respecto a esa base.

## Alcance comprobado

| Comprobacion | Resultado |
| --- | --- |
| Sintaxis de archivos propios | node --check en cada archivo JavaScript durante la preparacion de commits. |
| Analisis estatico del servidor | npm run lint, oxlint --deny-warnings: sin errores ni advertencias. |
| Diferencias y formato | git diff --check y git diff --cached --check antes de cada commit. Se corrigio una linea vacia sobrante detectada en la separacion de J3. |
| Servidor y persistencia | 17 escenarios aprobados, 0 fallos, contra Express y MongoDB 7.0.14 real en replica set temporal. |
| Postman original de Gustavo | 38 peticiones y sus aserciones originales ejecutadas con Newman; 0 fallos. Archivo original conservado. |
| Postman adicional | 27 peticiones de autenticacion, perfiles, catalogos y CRUD de iniciativas; 0 fallos. |
| Cliente existente | 19 tests aprobados, 0 fallos; npm run lint aprobado. |
| Compilaciones React | npm run build y npm run build:gustavo aprobados con Node 24.22.1. |
| Archivos de companeros | Sin cambios en cliente/, avance1/ ni pruebas/participacion.postman_collection.json. |

Las pruebas se ejecutaron primero durante la preparacion y nuevamente desde servidor/ dentro del repositorio. MongoDB efimero evita modificar una base local del equipo. Las credenciales de pruebas son ficticias y las cookies se inyectan en memoria, sin exportarlas a las colecciones.

## Revision de codigo y correcciones

- Se verifico el recorrido ruta -> servicio -> repositorio/modelo. No se confia en el usuarioId recibido del navegador para autenticar ni autorizar.
- Se revisaron listas blancas de cuerpos y filtros para proteger propietario, correo, ID, estado de cuenta, fechas y equipo. Los operadores MongoDB se construyen solo desde valores escalares previamente validados; el texto de busqueda se escapa como literal.
- Se revisaron las proyecciones de respuestas: los perfiles ajenos omiten correo; nunca se devuelve hash; restringidas omiten descripcion/problema/equipo; privadas ajenas se ocultan; proyectos vuelven a consultar acceso al origen.
- Se fijaron explicitamente los nombres de colecciones para evitar que un plural automatico difiera de la documentacion, especialmente solicitudes.
- Se revisaron transacciones, indices y bloqueo por revision de iniciativa. Se probaron registros duplicados simultaneos, dos pendientes simultaneas, dos aceptaciones, dos conversiones y conversion frente a retiro.
- Se verifico conservacion de historial al archivar, cancelar y retirar, y la referencia permanente del proyecto a la iniciativa.
- Se corrigieron las dos advertencias iniciales del analizador: una importacion sin uso y una comprobacion de prefijo textual. El comando final rechaza advertencias.
- Se revisaron errores 400/401/403/404/409/500 y respuestas 200/201/204. La prueba de 500 provoca deliberadamente un fallo interno controlado; su mensaje en la consola de pruebas es esperado y no representa una prueba fallida.
- Se reviso que .env, secretos, cookies, node_modules y compilaciones queden fuera de los commits. Los mensajes usan los titulos asignados y la identidad Git ya configurada por Jorge; no se cambian fechas ni configuracion de autor.

## Correspondencia con la rubrica

El contrato atiende el criterio 5; arquitectura y HTTP, el 6; modelo y justificacion, el 7; ciclo de iniciativas, el 8; solicitudes y equipos, el 9; conversion, el 10; filtros y paginacion del servidor, el 11; autenticacion y autorizacion, el 12 y 13; colecciones, el 15; documentacion e historial local, parte del 16.

Los criterios de interfaz y GitHub se conservaron y se comprobaron mediante los tests y compilaciones disponibles del cliente, sin afirmar una revision visual completa de todas las pantallas. La guia explica el codigo para preparar la defensa; las pruebas no sustituyen el dominio individual ni garantizan la evaluacion.

## Pendientes y limites reales

1. D7: conectar autenticacion, perfiles e iniciativas a la API, integrar las pantallas de participacion en App.jsx, cerrar sesion por HTTP y ampliar los formularios a los campos/visibilidades/categorias documentados. No se modifico ese trabajo desde los commits J.
2. Tras integrar D7, repetir las colecciones y ejecutar el recorrido completo desde React: registro -> perfil -> iniciativa -> solicitud -> aceptacion -> equipo -> conversion -> proyecto/GitHub. Aun no se acredita ese recorrido en navegador.
3. El cliente instalado requiere Node >=22.22.0 por react-router. El equipo tenia Node 22.17.0 por defecto; la verificacion utilizo Node 24.22.1 compatible.
4. Las compilaciones conservan avisos previos de deprecacion de Sass/Bootstrap; no impiden compilar y no se cambio el estilo de los companeros para eliminarlos.
5. Newman muestra avisos de dependencias transitivas antiguas durante npm ci. Son herramientas de desarrollo, no parte del servidor HTTP desplegado. La instalacion y la ejecucion de las pruebas finalizaron correctamente.
6. MongoDB de desarrollo debe tener replica set. No se instalo un servicio permanente ni se modifico una base con informacion del usuario; se documento como levantarlo.
7. Los 10 commits son locales. No se hace push ni se crea entrega-2 sobre la integracion todavia pendiente. El cierre de equipo debe revisar y congelar el contrato definitivo antes de esa etiqueta.

## Repetir la verificacion

Desde servidor/: npm ci, npm run lint y npm test. Desde cliente/, con Node compatible: npm ci, npm test, npm run lint, npm run build y npm run build:gustavo. Para ejecutar Postman manualmente contra la base _demo, seguir servidor/README.md y conservar las claves/cookies solo en el entorno local.

Documentacion oficial de referencia: [sesiones de Express](https://expressjs.com/en/resources/middleware/session/) y [transacciones de Mongoose](https://mongoosejs.com/docs/8.x/docs/transactions.html). La implementacion usa sesiones regeneradas/destruidas y transacciones de conexion para aplicar esas decisiones.
