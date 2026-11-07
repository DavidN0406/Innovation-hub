# Revisión del repositorio y cierre de Gustavo

Revisión realizada el 7 de noviembre de 2026, tomando como base `50c4375` (`Implementar detalle de iniciativa`). Se inspeccionaron estructura, historial, dependencias, rutas, páginas, estilos, datos simulados, servicios, documentación y herramientas del cliente. Se preserva `avance1/`.

## Alcance de G1 a G9

| Commit | Resultado |
| --- | --- |
| G1 | Servicios de participación, propuesta de contrato y vista independiente. |
| G2 | Crear/consultar propias, editar pendientes, cancelar y validación. |
| G3 | Recibidas filtradas por iniciativa/estado, aceptar/rechazar y recarga. |
| G4 | Equipo, retiro confirmado según permisos y protección del propietario. |
| G5 | Conversión con campos exigidos y errores por campo. |
| G6 | Listado paginado y detalle por ID con referencia de origen. |
| G7 | Consulta de los siete datos de GitHub y manejo de fallos. |
| G8 | Colección propuesta de 38 casos, datos necesarios e instrucciones de ejecución. |
| G9 | README, guía de integración, revisión y comprobaciones de cierre. |

## Comprobaciones realizadas

- Node 24.19.0 / npm 11.17.0; instalación reproducible con `npm ci` en cliente.
- 19 pruebas automatizadas aprobadas: transiciones, permisos simulados, duplicados, RN-09, fechas, GitHub y transporte real con respuestas controladas. No son pruebas del servidor Express.
- `npm run lint`: sin avisos del código del cliente.
- `npm run build` y `npm run build:gustavo`: compilación correcta. Sass muestra avisos de deprecación de los imports/Bootstrap preexistentes.
- Navegador Edge: editar, validar campos vacíos, crear y cancelar solicitud; filtrar recibidas, aceptar y comprobar nuevo integrante; proteger propietario, retirar miembro y convertir; detalle/listado y siete campos GitHub con respuesta controlada; protección sin sesión y ruta inexistente.
- Consulta adicional real a GitHub desde el navegador: siete datos recibidos del repositorio público `DavidN0406/Innovation-hub`, incluida descripción nula y cero asuntos abiertos. Las pruebas de errores usan respuestas controladas para ser reproducibles.
- Colección: 38 peticiones con cuerpos JSON válidos, variables declaradas y scripts de aserción sintácticamente válidos. Pendiente su ejecución sobre el servidor real.
- Vista de 1280 px y 390 px: revisión visual, sin desbordamiento horizontal en detalle.
- `App.jsx`, `main.jsx` y los servicios ajenos permanecen iguales a la base.

## Segunda revisión del alcance

Se cotejaron los nueve commits con G1 a G9 de la asignación. Se retiró la propuesta adicional de modelo de base de datos para limitar los entregables al trabajo asignado. Permanecen únicamente las pantallas y servicios de participación/proyectos/GitHub, su entrada de desarrollo, pruebas y documentación de ejecución/integración.

Comprobado contra la base: sin cambios en `App.jsx`, `main.jsx`, Navbar, estilos, datos compartidos, servicios de usuarios/autenticación/iniciativas, versiones de dependencias, archivos de bloqueo, `avance1/` ni `servidor/`. Los cambios de configuración se limitan a comandos para ejecutar/probar la entrada independiente, variables de ejemplo y exclusión de resultados generados. No se incorporan secretos, dependencias instaladas ni compilaciones.

Revisión móvil adicional de listas y formulario a 390 px: sin desbordamiento horizontal. El contrato de participación sigue siendo una propuesta pendiente de confirmar con el equipo; no se agregan implementaciones de servidor ni nuevas funciones fuera de G1 a G9.

## Pendientes para entregar el proyecto completo

Estos pendientes ya existían o dependen de integración; no deben presentarse como resueltos por la simulación:

1. `servidor/` solo tiene `.gitkeep`: faltan Express, MongoDB, CORS, validación, autenticación/hash y autorización reales, semillas y scripts de ejecución. No hay servidor contra el cual ejecutar Postman.
2. No existe contrato general congelado. La propuesta de participación debe acordarse con el equipo y con las RN del documento general, que no fue aportado durante esta revisión.
3. Los servicios existentes de usuarios/autenticación/iniciativas solo operan en modo DEV; sus cuentas/datos viven en memoria y no son integración real con la base de datos.
4. El catálogo actual filtra solo públicas y el detalle simula dos niveles de visibilidad; faltan los cuatro niveles requeridos en el servidor. La propuesta de Gustavo conserva esa limitación en la demostración.
5. La aplicación principal todavía usa placeholders para formularios y nuevas pantallas. La integración queda descrita en `integracion-gustavo.md` y no se modifica `App.jsx` según G1.
6. Completar `docs/api-contract.md`, `docs/modelo-datos.md`, colección de los demás recursos y reporte real de ejecución. Confirmar sesiones y estados antes de congelar.
7. La etiqueta `entrega-2` debe crearse al cerrar la entrega completa, sobre un commit validado por el equipo. Esta rama de trabajo no se etiqueta como entrega final. Las fechas originales del historial se conservan.
