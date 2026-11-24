# Revisión de diseño de Tarea 3

Origen: DavidN0406/Innovation-hub, main, commit 07607f1e1d91cb040210fd11b8a163645993d57d. El modelo y las dos rutas usan nombres, estados y reglas del servidor Express existente.

- Se conservan 14 tablas de dominio, todas las referencias y los arreglos del esquema MongoDB real.
- Las competencias de usuario/iniciativa conservan su posición mediante Orden; las de solicitud ya la conservaban.
- Catálogos conservan fechas; el inventario de sesiones refleja connect-mongo y explica por qué no se migra.
- El vínculo proyecto-iniciativa es uno a uno opcional; equipo del proyecto se deriva de su iniciativa.
- DELETE incorpora la condición de que no haya integrantes adicionales al propietario.
- La selección paginada usa @Pagina calculada; no depende del Id 4 escrito en consultas relacionadas.
- Se documentan parámetros, permisos anónimos y campos del JSON comparados con presentarIniciativa.
- La investigación corrige la ruta /initiatives, aclara tracking en proyecciones y que una entidad intermedia no obliga a usar Id propio.

Los datos son ejemplos documentales completos para el diseño, no afirman ser una exportación de producción. Las consultas se revisaron documentalmente; la consigna no exige ejecutarlas. Este trabajo no modifica el contrato de API existente ni implementa el servidor final.

David preparó los documentos de diseño e investigación. Gustavo revisó el modelo, la migración y las rutas. Jorge corrigió la condición de borrado en [su aporte a la Tarea 3](https://github.com/DavidN0406/Innovation-hub/pull/2). La entrega conserva sus commits originales.
