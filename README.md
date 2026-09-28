# Innovation Hub

Proyecto del curso SOFT-12 Programación web avanzada, Universidad CENFOTEC.

## Identificación del equipo

- David Navarro
- Jorge García Núñez

**Sección:** SCV2
**Periodo:** III cuatrimestre 2026
**Docente facilitador:** Álvaro Cordero Peña

## Descripción del sistema

Innovation Hub es una aplicación web donde la comunidad universitaria publica ideas, necesidades y retos, declara las competencias que cada iniciativa requiere y forma equipos interdisciplinarios. Este Avance 1 es un prototipo navegable en el navegador, sin servidor ni base de datos. Los datos viven en archivos JSON del repositorio y en arreglos de JavaScript, y los cambios locales se conservan con localStorage.

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

Nota sobre el historial: los 11 commits del 7 de setiembre corresponden al taller de configuración del repositorio y no se cuentan en la tabla. Los commits del avance se hicieron los días 23, 25 y 27 de setiembre.

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

<!-- FIN TABLA COMMITS -->

## Activar el hook de pre-commit

Este repositorio incluye un script que actualiza automáticamente la tabla de commits antes de cada commit. Los hooks de Git no se versionan, así que cada persona debe activarlo manualmente después de clonar el repositorio:

\`\`\`bash
chmod +x herramientas/tabla-commits.sh
cp herramientas/tabla-commits.sh .git/hooks/pre-commit
echo "git add README.md" >> .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
\`\`\`

> **Nota:** Debido a cómo funcionan los hooks de Git, cada commit aparece 
> reflejado en la tabla hasta que se realiza el commit siguiente, ya que 
> el hook actualiza la tabla antes de que el commit actual se registre 
> en el historial.
