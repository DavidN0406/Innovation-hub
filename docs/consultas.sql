-- consultas.sql
-- Consultas de ejemplo sobre el modelo de SQL Server del Innovation Hub (ver modelo-datos.md).
-- Están escritas a mano para T-SQL y no es obligatorio ejecutarlas.
-- El resultado esperado de cada una se calcula con los datos de prueba del paso 5 del plan de migración.
-- Cada consulta se piensa sobre los datos de prueba originales: las del 5 al 10 no se ejecutan una tras otra.
-- Las fechas se muestran sin fracciones de segundo para que sea más fácil leerlas.

-- ============================================================================
-- 1. JOIN entre dos tablas relacionadas 1 a muchos
-- Qué hace: Lista cada iniciativa con el nombre de su propietario. Una iniciativa tiene un propietario y un usuario puede ser propietario de varias (Iniciativas.PropietarioId apunta a Usuarios).
-- Resultado esperado (4 filas):
--   Id  Titulo                                           Propietario  PrimerApellido
--   --  -----------------------------------------------  -----------  --------------
--   1   Banco de tutorías entre pares                    Ana          Rojas
--   2   Monitoreo del consumo eléctrico en laboratorios  Marta        Chaves
--   3   App de hábitos saludables                        Diego        Mora
--   4   Club de lectura técnica                          Luis         Vargas
SELECT i.Id, i.Titulo, u.Nombre AS Propietario, u.PrimerApellido
FROM Iniciativas AS i
JOIN Usuarios AS u ON u.Id = i.PropietarioId
ORDER BY i.Id;

-- ============================================================================
-- 2. JOIN que recorre una relación muchos a muchos
-- Qué hace: Muestra las competencias que requiere cada iniciativa. Pasa por la tabla intermedia IniciativaCompetencias para llegar de Iniciativas a Competencias.
-- Resultado esperado (10 filas):
--   IniciativaId  Titulo                                           Competencia
--   ------------  -----------------------------------------------  --------------------
--   1             Banco de tutorías entre pares                    JavaScript
--   1             Banco de tutorías entre pares                    React
--   1             Banco de tutorías entre pares                    Bases de datos
--   2             Monitoreo del consumo eléctrico en laboratorios  Node.js
--   2             Monitoreo del consumo eléctrico en laboratorios  Bases de datos
--   2             Monitoreo del consumo eléctrico en laboratorios  Gestión de proyectos
--   3             App de hábitos saludables                        React
--   3             App de hábitos saludables                        Diseño de interfaces
--   4             Club de lectura técnica                          JavaScript
--   4             Club de lectura técnica                          Gestión de proyectos
SELECT i.Id AS IniciativaId, i.Titulo, c.Nombre AS Competencia
FROM Iniciativas AS i
JOIN IniciativaCompetencias AS ic ON ic.IniciativaId = i.Id
JOIN Competencias AS c ON c.Id = ic.CompetenciaId
ORDER BY i.Id, c.Id;

-- ============================================================================
-- 3. Conteo con GROUP BY
-- Qué hace: Cuenta cuántas solicitudes tiene cada iniciativa. Usa LEFT JOIN para que aparezcan también las iniciativas sin solicitudes, con 0.
-- Resultado esperado (4 filas):
--   Id  Titulo                                           TotalSolicitudes
--   --  -----------------------------------------------  ----------------
--   1   Banco de tutorías entre pares                    1
--   2   Monitoreo del consumo eléctrico en laboratorios  0
--   3   App de hábitos saludables                        1
--   4   Club de lectura técnica                          0
SELECT i.Id, i.Titulo, COUNT(s.Id) AS TotalSolicitudes
FROM Iniciativas AS i
LEFT JOIN Solicitudes AS s ON s.IniciativaId = i.Id
GROUP BY i.Id, i.Titulo
ORDER BY i.Id;

-- ============================================================================
-- 4. Muchos a muchos con datos propios (el equipo de una iniciativa)
-- Qué hace: Lista quiénes forman el equipo de la iniciativa 1, con el rol y la fecha de incorporación que guarda EquipoIniciativa.
-- Resultado esperado (3 filas):
--   Integrante  Rol                 FechaIncorporacion
--   ----------  ------------------  -------------------
--   Ana         Coordinación        2026-10-01 15:00:00
--   Luis        Desarrollo backend  2026-10-05 14:30:00
--   Marta       Asesoría            2026-10-12 16:20:00
SELECT u.Nombre AS Integrante, e.Rol, e.FechaIncorporacion
FROM EquipoIniciativa AS e
JOIN Usuarios AS u ON u.Id = e.UsuarioId
WHERE e.IniciativaId = 1
ORDER BY e.Id;

-- ============================================================================
-- 5. UPDATE con su WHERE
-- Qué hace: Marca a Diego (usuario 4) como no disponible para nuevos equipos y actualiza su fecha de modificación. Sin el WHERE cambiaría a todos los usuarios.
-- Resultado esperado: 1 fila afectada (solo el usuario 4).
UPDATE Usuarios
SET Disponible = 0,
    FechaModificacion = SYSUTCDATETIME()
WHERE Id = 4;

-- ============================================================================
-- 6. DELETE con su WHERE
-- Qué hace: Elimina la iniciativa 4 si no tiene solicitudes, retiros, proyecto ni integrantes distintos del propietario.
-- Regla del Avance 2: si existe alguna de esas relaciones, este DELETE afecta 0 filas y corresponde archivar la iniciativa.
-- Resultado esperado: 1 fila afectada en Iniciativas, porque el único integrante es el propietario.
-- Por el CASCADE se borran también su fila de EquipoIniciativa, 2 competencias y 2 etiquetas de la iniciativa.
DELETE FROM Iniciativas
WHERE Id = 4
  AND NOT EXISTS (SELECT 1 FROM Solicitudes WHERE IniciativaId = 4)
  AND NOT EXISTS (SELECT 1 FROM RetirosEquipo WHERE IniciativaId = 4)
  AND NOT EXISTS (SELECT 1 FROM Proyectos WHERE IniciativaId = 4)
  AND NOT EXISTS (
      SELECT 1
      FROM EquipoIniciativa AS e
      WHERE e.IniciativaId = Iniciativas.Id
        AND e.UsuarioId <> Iniciativas.PropietarioId
  );

-- ============================================================================
-- 7. INSERT que la base rechaza (índice único filtrado)
-- Qué hace: Intenta crear una segunda solicitud pendiente de Ana (usuario 1) para la iniciativa 3. Ana ya tiene una pendiente ahí (solicitud 1).
-- Resultado esperado: la base rechaza el INSERT.
-- Error 2601 de SQL Server: no se puede insertar una fila duplicada por el índice único UX_Solicitudes_Pendiente.
-- Por qué: El índice único filtrado solo permite una solicitud con Estado = 'pendiente' por cada pareja (IniciativaId, SolicitanteId).
INSERT INTO Solicitudes (IniciativaId, SolicitanteId, Mensaje, Disponibilidad, RolSolicitado, Estado)
VALUES (3, 1, N'Quiero volver a solicitar.', N'Lunes por la noche', N'Desarrollo frontend', 'pendiente');

-- ============================================================================
-- 8. INSERT que la base rechaza (CHECK)
-- Qué hace: Intenta crear una iniciativa con visibilidad 'secreta', que no existe en el catálogo.
-- Resultado esperado: la base rechaza el INSERT.
-- Error 547 de SQL Server: el INSERT entra en conflicto con la restricción CHECK CK_Iniciativas_Visibilidad.
-- Por qué: Visibilidad solo acepta publica, institucional, restringida o privada.
INSERT INTO Iniciativas (Titulo, Tipo, Resumen, Descripcion, Problema, Beneficiarios, CategoriaId, ParticipantesEstimados, Visibilidad, PropietarioId)
VALUES (N'Iniciativa de prueba', 'Idea', N'Resumen de una iniciativa de prueba para la restricción.',
        N'Descripción de una iniciativa de prueba que usa una visibilidad inválida.', N'Problema de prueba.',
        N'Comunidad', 1, 3, 'secreta', 1);

-- ============================================================================
-- 9. INSERT que la base rechaza (UNIQUE)
-- Qué hace: Intenta crear un segundo proyecto para la iniciativa 2, que ya fue convertida.
-- Resultado esperado: la base rechaza el INSERT.
-- Error 2627 de SQL Server: violación de la restricción UNIQUE UQ_Proyectos_Iniciativa.
-- Por qué: Proyectos.IniciativaId es UNIQUE: una iniciativa genera como máximo un proyecto.
INSERT INTO Proyectos (IniciativaId, Nombre, Descripcion, Objetivo, FechaInicio)
VALUES (2, N'Otro proyecto', N'Segundo intento de convertir la misma iniciativa.', N'Probar la restricción UNIQUE.', '2026-11-01');

-- ============================================================================
-- 10. DELETE que la base rechaza (llave foránea)
-- Qué hace: Intenta borrar a Ana (usuario 1), que es propietaria de la iniciativa 1 y está en su equipo.
-- Resultado esperado: la base rechaza el DELETE.
-- Error 547 de SQL Server: el DELETE entra en conflicto con la restricción REFERENCE de la llave foránea Iniciativas.PropietarioId.
-- Por qué: La llave foránea de PropietarioId impide borrar (no tiene CASCADE). Las cuentas se desactivan con Activo = 0.
DELETE FROM Usuarios
WHERE Id = 1;
