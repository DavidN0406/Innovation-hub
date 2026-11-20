# Investigación breve sobre EF Core

## 1. Datos relacionados: Select, Include y AsNoTracking

Entity Framework Core permite obtener información relacionada de diferentes formas según la necesidad de la consulta. La diferencia principal está en si se necesitan entidades completas o solamente los datos necesarios para una respuesta.

### Include

`Include` se utiliza para cargar una entidad junto con sus relaciones. Es útil cuando se necesita trabajar con los objetos relacionados completos mediante las propiedades de navegación.

Tomando como ejemplo una ruta de lectura del diseño de Innovation Hub, como el detalle de una iniciativa (`GET /api/iniciativas/{id}`), la consulta podría necesitar la iniciativa junto con sus competencias y los usuarios que forman parte del equipo.

Ejemplo:

```csharp
var iniciativa = await context.Iniciativas
    .Include(i => i.Competencias)
    .Include(i => i.Equipo)
        .ThenInclude(e => e.Usuario)
    .FirstOrDefaultAsync(i => i.Id == id);
```

En este caso se cargan los datos relacionados porque forman parte de la respuesta completa del detalle.

### Select

`Select` realiza una proyección. En lugar de cargar toda la entidad, permite elegir solamente los campos necesarios para una consulta específica. Esto reduce la información recuperada y mejora el rendimiento.

Ejemplo:

```csharp
var iniciativas = await context.Iniciativas
    .Select(i => new
    {
        i.Id,
        i.Nombre,
        CantidadMiembros = i.Equipo.Count
    })
    .ToListAsync();
```

Esta opción es conveniente para listados donde solamente se necesita mostrar información resumida y no todas las propiedades relacionadas.

### AsNoTracking

Por defecto, EF Core mantiene un seguimiento de las entidades consultadas para detectar cambios y permitir actualizaciones. Cuando una consulta solamente muestra información y no modifica datos, se puede utilizar `AsNoTracking()`.

Ejemplo:

```csharp
var iniciativas = await context.Iniciativas
    .AsNoTracking()
    .ToListAsync();
```

Esto reduce el uso de memoria y mejora el rendimiento en consultas de solo lectura.

En resumen:

- `Include`: cuando se necesitan entidades relacionadas completas.
- `Select`: cuando solo se requieren algunos datos para una respuesta.
- `AsNoTracking`: cuando los datos solamente serán consultados.

---

## 2. Muchos a muchos con datos propios

Una relación muchos a muchos puede resolverse con una tabla intermedia simple cuando solamente se necesitan las llaves de las entidades relacionadas.

Por ejemplo:

```
UsuarioCompetencia

UsuarioId
CompetenciaId
```

En este caso no existe información adicional, por lo que EF Core puede manejar la relación sin crear una clase intermedia.

Sin embargo, en el modelo de Innovation Hub existe una relación donde sí se necesitan datos adicionales: los usuarios que participan en una iniciativa.

La relación contiene información propia como:

- UsuarioId
- IniciativaId
- Rol
- FechaIncorporacion

Por esta razón no basta una tabla intermedia automática. Se necesita una entidad intermedia, por ejemplo:

```
EquipoIniciativa

Id
UsuarioId
IniciativaId
Rol
FechaIncorporacion
```

Esta entidad permite representar correctamente la relación entre usuarios e iniciativas y almacenar la información adicional de cada participación.

---

## 3. Paginación en la base de datos

Cuando existen muchos registros, la paginación debe realizarse directamente en la base de datos y no después de cargar toda la información en la aplicación.

EF Core utiliza los métodos `Skip()` y `Take()`:

- `Skip()` indica la cantidad de registros que se deben omitir.
- `Take()` indica la cantidad de registros que se deben devolver.

Ejemplo:

```csharp
var iniciativas = await context.Iniciativas
    .OrderBy(i => i.Id)
    .Skip(20)
    .Take(10)
    .ToListAsync();
```

Esta consulta obtiene una página de resultados sin traer todos los registros existentes.

En SQL Server, EF Core traduce esta operación utilizando `OFFSET` y `FETCH`.

Ejemplo del SQL generado:

```sql
SELECT *
FROM Iniciativas
ORDER BY Id
OFFSET 20 ROWS
FETCH NEXT 10 ROWS ONLY;
```

No se debe realizar la paginación en memoria porque obligaría a cargar todos los registros primero y después aplicar `Skip()` y `Take()`. Esto aumenta el consumo de memoria, el tiempo de respuesta y el tráfico entre la aplicación y la base de datos.

La forma correcta es aplicar la paginación en la consulta para que el motor de base de datos procese únicamente los registros necesarios.

---

## Fuentes

- Microsoft Learn. Entity Framework Core documentation.
  https://learn.microsoft.com/ef/core/

- Microsoft Learn. Loading Related Data.
  https://learn.microsoft.com/ef/core/querying/related-data/

- Microsoft Learn. Efficient Querying.
  https://learn.microsoft.com/ef/core/performance/efficient-querying/
