import { Router } from 'express'; // Expone catalogos persistidos sin agregar mantenimiento fuera del alcance del avance.
import { Competencia, Categoria } from '../datos/modelos.js'; // Consulta los mismos catalogos que validan perfiles e iniciativas.
import { exigirSesion } from '../middleware/sesion.js'; // Reserva el uso de catalogos para usuarios autenticados.
import { paginar } from '../datos/repositorio.js'; // Evita descargar colecciones completas tambien en catalogos.
import { paginacion, filtroTexto, texto } from '../servicios/validacion.js'; // Valida filtros y numeros de pagina.
import { exigir } from '../middleware/errores.js'; // Normaliza respuestas para catalogos o IDs inexistentes.

export const rutasCatalogos = Router(); // Se monta bajo /api para competencias y categorias.
for (const [ruta, Modelo] of [['skills', Competencia], ['categories', Categoria]]) { // Comparte estructura para dos recursos de solo lectura.
  rutasCatalogos.get(`/${ruta}`, exigirSesion, async (req, res) => { // Ofrece filtro literal y paginacion desde MongoDB.
    const { page, size } = paginacion(req.query, ['q']); // Limita el tamano de pagina y rechaza filtros no declarados.
    const nombre = filtroTexto(req.query.q, 'q'); // Escapa metacaracteres de busqueda antes de construir el filtro.
    const pagina = await paginar(Modelo, nombre ? { nombre } : {}, { nombre: 1, _id: 1 }, page, size); // Cuenta y pagina en el servidor con orden estable.
    res.json({ ...pagina, items: pagina.items.map(item => ({ id: item.id, nombre: item.nombre, categoria: item.categoria ?? null })) }); // Devuelve solo campos del catalogo, sin detalles internos de MongoDB.
  });
  rutasCatalogos.get(`/${ruta}/:id`, exigirSesion, async (req, res) => { // Permite consultar una categoria o competencia por su identificador de texto.
    const item = await Modelo.findOne({ _id: texto(req.params.id, 'id') }); // Usa una igualdad escalar, sin aceptar operadores del usuario.
    exigir(item, 404, 'NOT_FOUND', 'Elemento no encontrado.'); // Cubre el caso de recurso inexistente exigido por la rubrica.
    res.json({ id: item.id, nombre: item.nombre, categoria: item.categoria ?? null }); // Mantiene el mismo formato que cada elemento del listado.
  });
}
