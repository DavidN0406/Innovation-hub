# Innovation Hub

Proyecto del curso SOFT-12 Programación web avanzada, Universidad CENFOTEC.

## Identificación del equipo

- David Navarro
- Jorge García Núñez
- Gustavo Morera

**Sección:** SCV2
**Periodo:** III cuatrimestre 2026
**Docente facilitador:** Álvaro Cordero Peña

## Descripción del sistema

Innovation Hub es una aplicación web donde la comunidad universitaria publica ideas, necesidades y retos, declara las competencias que cada iniciativa requiere y forma equipos interdisciplinarios.

## Estado del Avance 2 y trabajo de Gustavo

El cliente React incluye catálogo, detalle y perfiles de desarrollo. La rama de Gustavo incorpora solicitudes, equipo, conversión, proyectos y GitHub en una entrada independiente, como se acordó para evitar cambios en `App.jsx`. El servidor de Jorge incorpora API Express, persistencia MongoDB, autenticación y permisos reales en los commits J1-J10. La integración de esos servicios con las pantallas simuladas del cliente continúa pendiente en D7; la demostración aislada no sustituye ese recorrido integrado. La [revisión detallada](docs/revision-avance2.md) enumera lo comprobado y lo pendiente para la entrega completa.

### Instalar y ejecutar el cliente

Usar Node.js compatible con Vite y el archivo de bloqueo; cierre verificado con Node 24.19.0 y npm 11.17.0. Desde la raíz:

```powershell
cd cliente
npm ci
Copy-Item .env.example .env.local
npm run dev
```

En macOS/Linux, usar `cp .env.example .env.local`. La aplicación principal se abre en la dirección que indique Vite. Los servicios existentes de perfiles, acceso e iniciativas son simulados y solo operan en desarrollo.

### Probar las pantallas de Gustavo

Desde `cliente/`, con una copia de las variables de ejemplo específicas (si ya existe `.env.local`, conservar su configuración y ajustar los valores indicados):

```powershell
Copy-Item .env.gustavo.example .env.local
npm run dev:gustavo
```

Abrir `/gustavo.html` en la dirección de Vite. Seleccionar el actor en “Probar como”. Ese selector solo cambia identidades ficticias; no inicia una sesión real. Datos en memoria, reiniciados al recargar. La guía incluye [datos y recorrido de demostración](docs/integracion-gustavo.md).

| Variable del cliente | Valor/uso |
| --- | --- |
| VITE_API_URL | Base HTTP del servidor, incluyendo `/api`; ejemplo local `http://localhost:3000/api`. |
| VITE_PARTICIPACION_MOCK | `true` para probar participación en desarrollo; `false` para consultar la API real. Nunca activa mocks en producción. |
| VITE_GITHUB_API_URL | `https://api.github.com`, API pública consultada directamente por React. |

Reiniciar Vite después de cambiar variables. Las variables `VITE_*` son públicas: no colocar claves ni cookies en ellas. `.env.local` y dependencias están excluidas de Git.

### Comprobar el cliente

```powershell
npm test
npm run lint
npm run build
npm run build:gustavo
```

Las compilaciones generan `dist/` y `dist-gustavo/`, fuera de Git. Compilar no acredita funcionamiento contra el servidor. La entrada independiente está orientada al desarrollo: para operar con API real hay que incorporar los componentes a la sesión de la aplicación principal siguiendo la [guía de integración](docs/integracion-gustavo.md).

### Servidor, MongoDB y cierre de entrega

El servidor ya está implementado en `servidor/`. Requiere Node.js 22 o superior y MongoDB con replica set para confirmar aceptación/equipo y conversión/proyecto de forma atómica. La [guía de ejecución del servidor](servidor/README.md) explica instalación, variables privadas, MongoDB, semillas y Postman.

Desde la raíz, después de preparar MongoDB:

```powershell
cd servidor
npm ci
Copy-Item .env.example .env
# Configurar MONGODB_URI, CLIENT_ORIGIN y un SESSION_SECRET propio en .env.
npm run dev
```

Para datos reproducibles usar una base terminada en `_demo`, configurar `SEED_PASSWORD` y ejecutar `npm run seed -- --confirmar-demo`. Las pruebas automáticas usan otra instancia MongoDB temporal y no modifican esa base. Ejecutar `npm run lint` y `npm test` desde `servidor/`.

Documentación de esta parte:

- [Contrato completo de la API](docs/api-contract.md): rutas, campos, códigos, permisos, filtros, estados y diferencias de integración.
- [Modelo de datos y decisiones de persistencia](docs/modelo-datos.md).
- [Guía explicada de los commits J1-J10 y del recorrido de cada petición](docs/guia-servidor-j.md).
- [Revisión y resultados de las pruebas del servidor](docs/revision-servidor-j.md).
- [Colección original de participación, 38 casos](pruebas/participacion.postman_collection.json), conservada sin cambios, y [colección adicional del servidor, 27 casos](pruebas/servidor.postman_collection.json). Ambas ejecutadas contra HTTP/MongoDB reales dentro de las pruebas automáticas; las claves y cookies se inyectan en memoria.
- [Propuesta histórica de participación](docs/api-participacion-propuesta.md), [guía de integración de Gustavo](docs/integracion-gustavo.md) y [revisión histórica del 7 de noviembre](docs/revision-avance2.md).

El código de `cliente/` y `avance1/` se conserva. En el estado recibido, los servicios de autenticación, perfiles e iniciativas usan simulación y `App.jsx` mantiene rutas de participación pendientes. D7 debe conectar esos servicios al contrato y a la sesión real, ampliar los formularios a las reglas documentadas e integrar navegación. Cambiar solamente `VITE_PARTICIPACION_MOCK=false` no completa ese trabajo.

El cierre comprobó 17 escenarios automáticos de servidor, las 65 peticiones de Postman, los 19 tests existentes del cliente, su análisis estático y ambas compilaciones. El cliente se verificó con Node 24.22.1; react-router exige Node >=22.22.0, por encima del Node 22.17.0 instalado por defecto en este equipo. Persisten avisos previos de deprecación de Sass, sin errores de compilación.

Antes de crear `entrega-2`, el equipo debe completar y probar el recorrido React-servidor-MongoDB desde las pantallas. Estos commits mantienen sus fechas reales y no crean una etiqueta de entrega sobre una integración pendiente.

## Prototipo del Avance 1

El Avance 1 es un prototipo navegable sin servidor ni base de datos. Los datos viven en archivos JSON del repositorio y en arreglos de JavaScript, y los cambios locales se conservan con localStorage. Este mecanismo pertenece al prototipo y no se usa como persistencia del Avance 2.

Pantallas incluidas: página principal, catálogo de iniciativas (con búsqueda y filtros), detalle de iniciativa (con la regla RN-03 de visibilidad), registro de iniciativa, modificación y eliminación, perfil de usuario y solicitud de participación.

## Estructura del proyecto

```
innovation-hub/
├── README.md
├── .gitignore
├── package.json
├── herramientas/
└── avance1/
    ├── index.html
    ├── paginas/    (catálogo, detalle, registro, perfil y solicitud)
    ├── datos/      (archivos JSON)
    ├── js/         (módulos de JavaScript)
    ├── scss/       (variables y parciales de Sass)
    ├── css/        (resultado compilado)
    └── img/
```

## Cómo compilar los estilos de Sass

Requiere Node.js. Desde la raíz del repositorio:

```
npm install
npx sass --quiet --load-path=node_modules avance1/scss/main.scss avance1/css/main.css
```

## Cómo ejecutar el prototipo

Abrir `avance1/index.html` en el navegador. No requiere instalación. El archivo `avance1/css/main.css` ya viene compilado en el repositorio.

Nota: como los datos se cargan con `fetch` desde archivos JSON, algunos navegadores bloquean esa lectura al abrir el archivo directamente. Si el catálogo aparece vacío, abrir el proyecto con la extensión Live Server de VS Code.

## Decisiones de diseño

- Se usa Bootstrap personalizado con Sass. Las variables propias (colores, tipografía, bordes y espaciados) sobrescriben las de origen de Bootstrap en `_variables.scss`.
- Los estilos se organizan en parciales por pantalla (`_navbar`, `_home`, `_tarjetas`, `_detalle`, `_formularios`, `_perfil`) para que cada integrante trabaje en archivos distintos.
- La barra de navegación se genera desde un solo arreglo en `nav.js`, así se mantiene igual en todas las pantallas.
- Todo el contenido variable se genera desde los datos con JavaScript, no está escrito en el HTML.
- La carga de datos usa `fetch` con `async` y `await` en `datos.js` y devuelve tres estados: listo, vacío y error.
- La búsqueda y los filtros por tipo, categoría y competencia se combinan sobre los datos ya cargados, y muestran un mensaje cuando no hay resultados.
- El detalle de iniciativa representa la regla RN-03: una iniciativa restringida solo muestra su resumen y un aviso de que el contenido completo no está disponible.
- Las acciones destructivas piden confirmación mediante un cuadro de diálogo.
- El código de JavaScript está dividido en módulos con responsabilidades separadas.
- Se diseñó pensando en el Avance 2, donde estas mismas pantallas se reescriben como componentes de React.

## Trabajo en equipo y commits

El trabajo se repartió por archivos para evitar conflictos: cada integrante fue dueño de sus páginas, módulos de JavaScript y parciales de Sass.

La tabla siguiente conserva el resumen histórico del repositorio. Para consultar el historial completo, incluidos los nueve commits de Gustavo, ejecutar `git log --oneline --decorate`.

## Resumen de commits

<!-- INICIO TABLA COMMITS -->

| # | Fecha | Hash | Mensaje |
|---|-------|------|---------|
| 1 | 2026-09-07 | 5072c81 | Crear estructura del avance 1 y documentacion inicial |
| 2 | 2026-09-07 | ab6acf1 | Coreccion en la documentacion inicial (.README) |
| 3 | 2026-09-07 | f5a1acb | Agregar tabla de resumen de commits |
| 4 | 2026-09-07 | 65eec6e | Prueba tabbla de commits automatica |
| 5 | 2026-09-07 | 2bf36d1 | Segunda prueba tabla automatica |
| 6 | 2026-09-07 | 864099a | Maquetar el encabezado y la navegación del catálogo |
| 7 | 2026-09-07 | e30e10d | corrige script y actualiza tabla de commits |
| 8 | 2026-09-07 | ead8a8c | Se agrega el titulo y el panel de filtros |
| 9 | 2026-09-07 | d355dc6 | Completar la estructura semántica del catálogo |
| 10 | 2026-09-07 | da96cd6 | Adicion textual al README |
| 11 | 2026-09-07 | 4a29c90 | Crear pantalla de detalle con niveles de visibilidad y formulario de solicitud |
| 12 | 2026-09-23 | 8007d07 | Corregir gitignore y renombrar catalago a catalogo |
| 13 | 2026-09-23 | 7c2b086 | Variables propias sobre Bootstrap y main.scss |
| 14 | 2026-09-25 | 1b896ff | feat(datos): usuarios de ejemplo para el perfil |
| 15 | 2026-09-25 | 1a937df | feat(js): modulo de validacion reutilizable |
| 16 | 2026-09-25 | 3b9a61a | feat(js): modulos nav y almacenamiento local |
| 17 | 2026-09-25 | 3391df2 | feat(datos): iniciativas, categorias y competencias en JSON |
| 18 | 2026-09-25 | 5588637 | feat(js): carga con fetch y estados de carga, error y vacio |
| 19 | 2026-09-25 | 42365fe | fix: agregar contenido faltante a scss y datos JSON |
| 20 | 2026-09-25 | bd9f1d7 | fix: corregir nombre de validacion.js |
| 21 | 2026-09-25 | da7cc9f | feat(home): pagina principal con explicacion del sistema |
| 22 | 2026-09-25 | ae9e2dd | feat(catalogo): tarjetas de iniciativas generadas desde datos |
| 23 | 2026-09-27 | ecc150a | style: estilos de navbar y compilacion de css |
| 24 | 2026-09-27 | 92034a6 | feat(catalogo): busqueda y filtros combinados con mensaje sin resultados |
| 25 | 2026-09-27 | 464c646 | feat(detalle): detalle desde datos y regla RN-03 de visibilidad |
| 26 | 2026-09-27 | df589e0 | feat(registro): formulario con campos de RF-I-INI-01 |
| 27 | 2026-09-27 | 5f283b0 | feat(registro): competencias dinamicas y validacion por campo |
| 28 | 2026-09-27 | 2613636 | feat(iniciativas): modificar y eliminar con modal de confirmacion |
| 29 | 2026-09-27 | 283333b | feat(perfil): pagina de perfil de usuario |
| 30 | 2026-09-27 | fbbfba9 | feat(solicitud): formulario de solicitud de participacion |
| 31 | 2026-09-27 | 93811f8 | fix(a11y): labels, alt y contraste en paginas propias |
| 32 | 2026-09-27 | 3407f7c | feat(nav): navbar de Bootstrap con menu colapsable generada desde nav.js |
| 33 | 2026-09-27 | ac79275 | feat(ui): Bootstrap en todas las pantallas, estilos Sass y CSS final |
| 34 | 2026-09-27 | cbe3849 | Entrega Final del Avance 1 |
| 35 | 2026-11-05 | dbaa04e | Preparar estructura del avance 2 |
| 36 | 2026-11-05 | fabd6d5 | Crear cliente React con Vite |
| 37 | 2026-11-05 | 619be49 | Migrar estilos y estructura visual del avance 1 |
| 38 | 2026-11-05 | 9aba611 | Configurar navegacion y rutas con React Router |
| 39 | 2026-11-06 | 39d22c4 | Configurar servicios y simulacion del cliente |
| 40 | 2026-11-06 | 46ebee2 | Implementar registro e inicio y cierre de sesion |
| 41 | 2026-11-06 | 86fced6 | Implementar perfiles y busqueda de usuarios |
| 42 | 2026-11-07 | dac17cf | Implementar catalogo de iniciativas en React |
| 43 | 2026-11-07 | 50c4375 | Implementar detalle de iniciativa |
| 44 | 2026-11-07 | 4acb875 | Preparar servicios y vista de desarrollo de Gustavo |
| 45 | 2026-11-07 | 9468319 | Implementar pantalla de mis solicitudes |
| 46 | 2026-11-07 | 73e080a | Implementar pantalla de solicitudes recibidas |
| 47 | 2026-11-07 | 3ef5e2f | Implementar pantalla de gestion del equipo |
| 48 | 2026-11-07 | 0fa8508 | Implementar formulario de conversion a proyecto |
| 49 | 2026-11-07 | bfa0291 | Implementar listado y detalle de proyectos |
| 50 | 2026-11-07 | 133687c | Mostrar informacion de repositorios desde GitHub |
| 51 | 2026-11-07 | 65bed79 | Crear coleccion de pruebas de la API |
| 52 | 2026-11-07 | e49b8d7 | Completar README y documentacion de entrega |

<!-- FIN TABLA COMMITS -->

## Actualizar la tabla histórica de commits

El script existente puede regenerar la tabla desde el historial. Se ejecuta desde la raíz en Git Bash y sus cambios se revisan antes de incluirlos en un commit:

```bash
bash herramientas/tabla-commits.sh
git diff -- README.md
```

El script solo puede incluir commits ya existentes. El commit que guarda su actualización no aparecerá hasta la próxima regeneración.
