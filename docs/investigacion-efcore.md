# Investigación breve sobre EF Core

Diseño: Innovation Hub. Los fragmentos son ejemplos para la entrega final, no una implementación del servidor en esta tarea.

## 1. Select, Include y AsNoTracking

Para `GET /api/initiatives/{id}`, `Select` proyecta los campos requeridos por el contrato. Puede recorrer navegaciones y EF Core traduce esas expresiones; no se necesita `Include` para usarlas dentro de la proyección. Por ejemplo, este fragmento obtiene competencias desde la tabla intermedia del diseño:

```csharp
var dto = await db.Iniciativas
    .Where(i => i.Id == id && i.Visibilidad == "publica"
        && i.Estado != "Borrador" && i.Estado != "Archivada")
    .Select(i => new {
        id = i.Id.ToString(), titulo = i.Titulo,
        competencias = i.IniciativaCompetencias.OrderBy(ic => ic.Orden)
            .Select(ic => ic.Competencia.Nombre).ToList()
    }).SingleOrDefaultAsync();
```

El fragmento ilustra la proyección; la respuesta completa agrega los demás campos de `rutas.md`. Seleccionar columnas evita transferir propiedades innecesarias, incluido el hash de los usuarios. `Include` carga entidades relacionadas y llena sus navegaciones; conviene cuando se trabaja con ese grafo de entidades. Por ejemplo: `db.Iniciativas.Include(i => i.Equipo).ThenInclude(e => e.Usuario)`. Cargar varias colecciones juntas puede multiplicar filas; se evalúa proyección o consultas separadas. [1, 2]

`AsNoTracking` evita registrar entidades materializadas en el ChangeTracker para detectar cambios. Conviene al devolver entidades completas en una lectura; al modificarlas se usa seguimiento o se adjuntan expresamente. Una proyección de valores como la anterior no materializa entidades y ya carece de entidades que seguir. Si un objeto proyectado incluye una entidad, esa entidad sí puede quedar seguida. [3]

## 2. Muchos a muchos con datos propios

Siempre hay una tabla intermedia relacional. EF Core puede manejarla sin una clase CLR propia cuando solo interesan sus dos FK: por ejemplo, una asociación usuario-competencia sin atributos adicionales, con PK (UsuarioId, CompetenciaId). [4]

En nuestro diseño final `EquipoIniciativa` tiene IniciativaId, UsuarioId, Rol y FechaIncorporacion: requiere representar esos datos en una entidad intermedia explícita. Su UNIQUE (IniciativaId, UsuarioId) impide duplicados. No es obligatorio que tenga Id propio: también serviría una PK compuesta. `SolicitudCompetencias` necesita entidad explícita por Orden, que identifica la competencia principal. Para preservar el orden original se agregó también Orden a UsuarioCompetencias e IniciativaCompetencias; estas asociaciones del diseño final se modelarán explícitamente. [4]

## 3. Paginación en la base

En `GET /api/initiatives?page=2&size=1`, primero se filtran las iniciativas públicas visibles. Con `OrderBy(i => i.Id).Skip((page-1)*size).Take(size)` y luego `ToListAsync`, Skip omite una fila y Take limita la página a una. En SQL Server la forma equivalente es: [1, 5]

```sql
SELECT i.Id, i.Titulo FROM Iniciativas i
WHERE i.Visibilidad = 'publica'
  AND i.Estado NOT IN ('Borrador', 'Archivada')
ORDER BY i.Id OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY;
```

El proveedor parametriza y selecciona las columnas de la proyección; el SQL anterior es ilustrativo. El conteo usa los mismos filtros. Id hace el orden único y estable. No se debe llamar ToList antes de Skip/Take: eso traería todas las filas al servidor de aplicaciones. SQL Server todavía debe procesar las filas omitidas; offsets grandes cuestan más y cambios concurrentes pueden desplazar resultados. La paginación por clave es una alternativa para siguiente/anterior, pero aquí se conserva page/size del contrato. [1, 5]

## Fuentes oficiales

1. [Consultas eficientes](https://learn.microsoft.com/ef/core/performance/efficient-querying).
2. [Carga con Include](https://learn.microsoft.com/ef/core/querying/related-data/eager).
3. [Seguimiento y proyecciones](https://learn.microsoft.com/ef/core/querying/tracking).
4. [Muchos a muchos y datos propios](https://learn.microsoft.com/ef/core/modeling/relationships/many-to-many).
5. [Paginación y orden único](https://learn.microsoft.com/ef/core/querying/pagination).
