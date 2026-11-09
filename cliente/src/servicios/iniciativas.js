import { solicitar, segmento, parametros } from "./api.js"
import { normalizarIniciativa } from "./validacionIniciativa.js"

export async function buscarIniciativas({ texto = "", tipo = "", categoria = "", competencia = "", orden = "fecha-desc", pagina = 1, tamano = 3, soloPropias = false, estado = "", visibilidad = "", espacios = "" } = {}, { signal } = {}) {
    const consulta = parametros({ q: texto, type: tipo, category: categoria, skill: competencia, sort: orden, page: pagina, size: tamano, scope: soloPropias ? "owned" : "", status: estado, visibility: visibilidad, spaces: espacios })
    const datos = await solicitar(`initiatives?${consulta}`, { signal })
    return { iniciativas: datos.items, total: datos.total, pagina: datos.page, totalPaginas: datos.totalPages }
}
// usuario se conserva como argumento para las pantallas; la identidad real siempre viene de la cookie.
export const consultarIniciativa = (id, usuario = null, { signal } = {}) => solicitar(`initiatives/${segmento(id)}`, { signal })
export const crearIniciativa = (datos, usuario, { signal } = {}) => solicitar("initiatives", { method: "POST", body: normalizarIniciativa(datos), signal })
export const actualizarIniciativa = (id, datos, usuario, { signal } = {}) => solicitar(`initiatives/${segmento(id)}`, { method: "PUT", body: normalizarIniciativa(datos), signal })
export const archivarIniciativa = (id, usuario, { signal } = {}) => solicitar(`initiatives/${segmento(id)}/archive`, { method: "PATCH", signal })
export const eliminarIniciativa = (id, { signal } = {}) => solicitar(`initiatives/${segmento(id)}`, { method: "DELETE", signal })
