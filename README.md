# Innovation Hub
Proyecto del curso SOFT-12 — Desarrollo Web Full Stack.
**Estudiante:** David Navarro
**Sección:** SOFT-12-C1 Programación Web Avanzada SCV2 **Periodo:** III cuatrimestre 2026
**Docente:** Alvaro Cordero Peña
## Descripción
Aplicación web que permite publicar ideas, necesidades y retos,
declarar las competencias que cada iniciativa requiere y conformar
equipos interdisciplinarios dentro de la comunidad universitaria.
## Estructura del repositorio
- `avance1/` — prototipo con HTML, CSS, JavaScript, Bootstrap y Sass
 - `paginas/` — pantallas del prototi
 - `datos/` — archivos JSON con datos simulados
 - `js/` — módulos de JavaScript
 - `scss/` — variables y parciales de Sass
 - `css/` — hoja de estilos compilada
## Cómo ejecutar
Abrir `avance1/index.html` en el navegador. No requiere instalación.
## Decisiones de diseño
_(se completa durante las semanas 2 a 4)_
## Resumen de commits
_(ver la tabla al final de este archivo)_

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

<!-- FIN TABLA COMMITS -->

## Activar el hook de pre-commit

Este repositorio incluye un script que actualiza automáticamente la tabla de commits antes de cada commit. Los hooks de Git no se versionan, así que cada persona debe activarlo manualmente después de clonar el repositorio:

\`\`\`bash
chmod +x herramientas/tabla-commits.sh
cp herramientas/tabla-commits.sh .git/hooks/pre-commit
echo "git add README.md" >> .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
\`\`\`
