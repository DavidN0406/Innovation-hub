# Diseño de dos rutas de lectura

Se escogieron dos rutas GET del contrato del Avance 2 ([api-contract.md](api-contract.md)) que no requieren iniciar sesión. Son las únicas que cumplen: los catálogos (`/skills`, `/categories`), los usuarios y los proyectos piden sesión. Las dos muestran datos de una relación muchos a muchos (las competencias de la iniciativa y su equipo).

Los JSON se armaron con los datos de prueba de [modelo-datos.md](modelo-datos.md), pidiendo la ruta como visitante, o sea sin sesión. Usan los mismos nombres de campo que responde hoy el servidor Express y los identificadores como texto. Las fechas van en ISO 8601 UTC como las entrega Express. Los parámetros de las consultas se escriben con `@`.

La regla de visibilidad del Avance 2 pasa al WHERE: un visitante solo ve iniciativas con `Visibilidad = 'publica'` y estado distinto de Borrador y Archivada. Las institucionales, restringidas y privadas no existen para él.

## Ruta 1. GET /api/initiatives/{id}

**Qué devuelve:** el detalle de una iniciativa con sus competencias, sus etiquetas y su equipo. Para el ejemplo se pide `GET /api/initiatives/1`.

**Tablas que lee:** Iniciativas, Categorias, Usuarios, IniciativaCompetencias, Competencias, IniciativaEtiquetas y EquipoIniciativa.

**Consultas SQL:** se hacen cuatro consultas pequeñas en lugar de un JOIN gigante. Unir competencias, etiquetas y equipo en una sola consulta multiplicaría las filas (3 competencias por 2 etiquetas por 3 integrantes serían 18 filas para una sola iniciativa).

```sql
DECLARE @Id INT = 1;

-- 1) Datos de la iniciativa. Si no devuelve fila, la respuesta es 404.
SELECT i.Id, i.Titulo, i.Tipo, i.Resumen, k.Nombre AS Categoria, i.Estado, i.PropietarioId, i.Visibilidad,
       i.Descripcion, i.Problema, i.Beneficiarios, i.ParticipantesEstimados,
       u.Nombre AS Autor, i.FechaCreacion, i.FechaModificacion
FROM Iniciativas AS i
JOIN Categorias AS k ON k.Id = i.CategoriaId
JOIN Usuarios AS u ON u.Id = i.PropietarioId
WHERE i.Id = @Id
  AND i.Visibilidad = 'publica'
  AND i.Estado NOT IN ('Borrador', 'Archivada');

-- 2) Competencias que requiere (muchos a muchos).
SELECT c.Nombre
FROM IniciativaCompetencias AS ic
JOIN Competencias AS c ON c.Id = ic.CompetenciaId
WHERE ic.IniciativaId = @Id
  AND EXISTS (SELECT 1 FROM Iniciativas i WHERE i.Id = @Id AND i.Visibilidad = 'publica' AND i.Estado NOT IN ('Borrador', 'Archivada'))
ORDER BY ic.Orden;

-- 3) Etiquetas.
SELECT Texto
FROM IniciativaEtiquetas
WHERE IniciativaId = @Id
ORDER BY Id;

-- 4) Equipo (muchos a muchos con rol y fecha propios).
SELECT e.UsuarioId, u.Nombre, e.Rol, e.FechaIncorporacion
FROM EquipoIniciativa AS e
JOIN Usuarios AS u ON u.Id = e.UsuarioId
WHERE e.IniciativaId = @Id
ORDER BY e.Id;
```

**De dónde sale cada campo del JSON:**

| Campo | Origen |
| --- | --- |
| id | Iniciativas.Id (como texto) |
| titulo, tipo, resumen, estado, visibilidad | Iniciativas (misma columna) |
| categoria | Categorias.Nombre, por Iniciativas.CategoriaId |
| propietarioId | Iniciativas.PropietarioId (como texto) |
| competencias | Competencias.Nombre, por IniciativaCompetencias |
| descripcion, problema, beneficiarios, participantesEstimados | Iniciativas (misma columna) |
| etiquetas | IniciativaEtiquetas.Texto |
| autor | Usuarios.Nombre del propietario |
| equipo[] | EquipoIniciativa con Usuarios.Nombre: usuarioId, nombre, rol y fechaIncorporacion |
| integrantesActuales | Se cuenta el arreglo equipo |
| espaciosDisponibles | ParticipantesEstimados menos integrantesActuales, mínimo 0 |
| fechaPublicacion | Los primeros 10 caracteres de FechaCreacion (YYYY-MM-DD) |
| fechaCreacion, fechaModificacion | Iniciativas, en ISO 8601 UTC |
| accesoCompleto | true, porque una iniciativa pública y visible se muestra completa |
| permisos | Para un visitante sin sesión todo es false menos puedeVerEquipo, que es true porque tiene acceso completo |

**JSON de respuesta (200):**

```json
{
  "id": "1",
  "titulo": "Banco de tutorías entre pares",
  "tipo": "Idea",
  "resumen": "Plataforma donde estudiantes avanzados ofrecen tutorías cortas a compañeros de cursos básicos.",
  "categoria": "Educación",
  "competencias": [
    "JavaScript",
    "React",
    "Bases de datos"
  ],
  "estado": "En formación de equipo",
  "propietarioId": "1",
  "visibilidad": "publica",
  "descripcion": "Se plantea un banco de tutorías donde cada estudiante publica los temas que domina y otros solicitan sesiones. El equipo diseñará el catálogo de temas, el agendado y el registro de horas de colaboración.",
  "problema": "Los estudiantes de primeros cuatrimestres no encuentran apoyo académico oportuno.",
  "beneficiarios": "Estudiantes de primer ingreso",
  "participantesEstimados": 4,
  "etiquetas": [
    "tutorías",
    "comunidad"
  ],
  "autor": "Ana",
  "equipo": [
    {
      "usuarioId": "1",
      "nombre": "Ana",
      "rol": "Coordinación",
      "fechaIncorporacion": "2026-10-01T15:00:00.000Z"
    },
    {
      "usuarioId": "2",
      "nombre": "Luis",
      "rol": "Desarrollo backend",
      "fechaIncorporacion": "2026-10-05T14:30:00.000Z"
    },
    {
      "usuarioId": "3",
      "nombre": "Marta",
      "rol": "Asesoría",
      "fechaIncorporacion": "2026-10-12T16:20:00.000Z"
    }
  ],
  "integrantesActuales": 3,
  "espaciosDisponibles": 1,
  "fechaPublicacion": "2026-10-01",
  "fechaCreacion": "2026-10-01T15:00:00.000Z",
  "fechaModificacion": "2026-10-12T16:20:00.000Z",
  "accesoCompleto": true,
  "permisos": {
    "puedeEditar": false,
    "puedeArchivar": false,
    "puedeSolicitar": false,
    "puedeVerEquipo": true,
    "puedeConvertir": false,
    "faltaMiembroParaConvertir": false
  }
}
```

**Cuando no hay fila:** con `GET /api/initiatives/2` (es institucional) o con un Id que no existe, la primera consulta no devuelve nada y se responde 404 con el error del contrato:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "La iniciativa no existe o no esta disponible.",
    "fields": {}
  }
}
```

## Ruta 2. GET /api/initiatives

**Qué devuelve:** el catálogo de iniciativas visibles para un visitante, en una lista paginada con la forma `{ items, total, page, size, totalPages }`. Cada elemento tiene el mismo formato del detalle de la ruta 1. Sin parámetros se usa `page=1` y `size=10`, con orden por Id ascendente. Para el ejemplo se pide `GET /api/initiatives?page=2&size=1`, la segunda página de tamaño 1, para que se vea el desplazamiento.

**Tablas que lee:** Iniciativas, Categorias, Usuarios, IniciativaCompetencias, Competencias, IniciativaEtiquetas y EquipoIniciativa.

**Consultas SQL:** la paginación se hace en la base con `OFFSET` y `FETCH`, y el total se cuenta con el mismo filtro. Las consultas 3, 4 y 5 piden los datos relacionados solo de las iniciativas de la página. Con los datos de prueba la página trae la iniciativa 4.

```sql
DECLARE @Page INT = 2, @Size INT = 1;
-- La API valida page entero 1..1000000 y size entero 1..100 antes de consultar.
IF @Page NOT BETWEEN 1 AND 1000000 OR @Size NOT BETWEEN 1 AND 100
    THROW 50001, 'Paginacion invalida', 1;
DECLARE @Pagina TABLE (Id INT PRIMARY KEY);
INSERT INTO @Pagina (Id)
SELECT i.Id FROM Iniciativas i
WHERE i.Visibilidad = 'publica' AND i.Estado NOT IN ('Borrador', 'Archivada')
ORDER BY i.Id OFFSET (@Page - 1) * @Size ROWS FETCH NEXT @Size ROWS ONLY;

-- 1) Total de iniciativas visibles (mismo filtro que la página).
SELECT COUNT(*) AS Total
FROM Iniciativas AS i
WHERE i.Visibilidad = 'publica'
  AND i.Estado NOT IN ('Borrador', 'Archivada');

-- 2) Las iniciativas de la página.
SELECT i.Id, i.Titulo, i.Tipo, i.Resumen, k.Nombre AS Categoria, i.Estado, i.PropietarioId, i.Visibilidad,
       i.Descripcion, i.Problema, i.Beneficiarios, i.ParticipantesEstimados,
       u.Nombre AS Autor, i.FechaCreacion, i.FechaModificacion
FROM Iniciativas AS i
JOIN Categorias AS k ON k.Id = i.CategoriaId
JOIN Usuarios AS u ON u.Id = i.PropietarioId
WHERE i.Id IN (SELECT Id FROM @Pagina)
ORDER BY i.Id;

-- 3) Competencias de las iniciativas de la página.
SELECT ic.IniciativaId, c.Nombre
FROM IniciativaCompetencias AS ic
JOIN Competencias AS c ON c.Id = ic.CompetenciaId
WHERE ic.IniciativaId IN (SELECT Id FROM @Pagina)
ORDER BY ic.IniciativaId, ic.Orden;

-- 4) Etiquetas de las iniciativas de la página.
SELECT IniciativaId, Texto
FROM IniciativaEtiquetas
WHERE IniciativaId IN (SELECT Id FROM @Pagina)
ORDER BY IniciativaId, Id;

-- 5) Equipo de las iniciativas de la página.
SELECT e.IniciativaId, e.UsuarioId, u.Nombre, e.Rol, e.FechaIncorporacion
FROM EquipoIniciativa AS e
JOIN Usuarios AS u ON u.Id = e.UsuarioId
WHERE e.IniciativaId IN (SELECT Id FROM @Pagina)
ORDER BY e.IniciativaId, e.Id;
```

La variable de tabla @Pagina contiene los Id obtenidos de SQL Server: no hay una lista fija en el código. Si cambia page, size o la base, las consultas de relaciones siguen usando la página calculada. El ejemplo documenta el listado sin filtros opcionales; si se agrega q/type/category/skill del contrato se aplica el mismo predicado parametrizado al COUNT y a la selección de @Pagina, antes de OFFSET/FETCH. Nunca se reciben nombres de columna u operadores SQL desde el cliente.

Con los datos de prueba hay dos iniciativas visibles para un visitante (la 1 y la 4), así que `total` es 2. Los demás campos salen igual que en la ruta 1. `totalPages` se calcula en el servidor como `ceil(total / size)` con mínimo 1.

**JSON de respuesta (200):**

```json
{
  "items": [
    {
      "id": "4",
      "titulo": "Club de lectura técnica",
      "tipo": "Idea",
      "resumen": "Espacio quincenal para leer y discutir artículos y libros sobre ingeniería de software.",
      "categoria": "Educación",
      "competencias": [
        "JavaScript",
        "Gestión de proyectos"
      ],
      "estado": "Publicada",
      "propietarioId": "2",
      "visibilidad": "publica",
      "descripcion": "Cada dos semanas el grupo elegirá una lectura, la discutirá en una sesión corta y publicará un resumen con aprendizajes y preguntas abiertas para la comunidad.",
      "problema": "Hay pocos espacios para discutir lecturas técnicas fuera de clase.",
      "beneficiarios": "Estudiantes y docentes de Software",
      "participantesEstimados": 6,
      "etiquetas": [
        "lectura",
        "comunidad"
      ],
      "autor": "Luis",
      "equipo": [
        {
          "usuarioId": "2",
          "nombre": "Luis",
          "rol": "Coordinación",
          "fechaIncorporacion": "2026-10-15T19:10:00.000Z"
        }
      ],
      "integrantesActuales": 1,
      "espaciosDisponibles": 5,
      "fechaPublicacion": "2026-10-15",
      "fechaCreacion": "2026-10-15T19:10:00.000Z",
      "fechaModificacion": "2026-10-15T19:10:00.000Z",
      "accesoCompleto": true,
      "permisos": {
        "puedeEditar": false,
        "puedeArchivar": false,
        "puedeSolicitar": false,
        "puedeVerEquipo": true,
        "puedeConvertir": false,
        "faltaMiembroParaConvertir": false
      }
    }
  ],
  "total": 2,
  "page": 2,
  "size": 1,
  "totalPages": 2
}
```

**Una página fuera de rango** conserva el número de página que se pidió y devuelve `items: []`.

## Validación y armado

El valor {id} llega como texto; la capa HTTP comprueba que represente un INT positivo antes de enlazarlo como parámetro. Un formato inválido responde 400 con `error.code = "VALIDATION_ERROR"`; un registro inexistente o no visible responde el 404 mostrado. En el detalle solo se consultan etiquetas y equipo después de comprobar que la consulta 1 devolvió una iniciativa autorizada. Nunca se exponen hash, correo ni la tabla de sesiones.

La capa de respuesta agrupa filas por IniciativaId, crea arreglos vacíos cuando no hay relaciones y convierte cada Id y FK pública a texto. Los JSON mostrados son ejemplos documentales de los datos de prueba; la futura implementación los construirá desde las filas y no devolverá estas cadenas como respuesta fija. El COUNT usa el mismo filtro público. Como el contrato actual, el conteo y las lecturas separadas no prometen una instantánea transaccional frente a cambios concurrentes.

Fuentes del contrato: `docs/api-contract.md` y `servidor/src/servicios/iniciativas.js` (`presentarIniciativa`, `listarIniciativas`), verificados sobre el commit `07607f1e1d91cb040210fd11b8a163645993d57d`. `permisos.js` confirma la exclusión de Borrador y Archivada para visitantes.
