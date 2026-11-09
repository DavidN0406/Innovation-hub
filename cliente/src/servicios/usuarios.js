import { solicitar, segmento, parametros } from "./api.js"

export const consultarPerfil = (id, { signal } = {}) => solicitar(`users/${segmento(id)}`, { signal })
export const actualizarPerfil = (id, cambios, { signal } = {}) => solicitar(`users/${segmento(id)}`, { method: "PUT", body: cambios, signal })
export async function buscarUsuarios({ nombre = "", competencia = "", carrera = "", disponibilidad = "", orden = "nombre-asc", pagina = 1, tamano = 3 } = {}, { signal } = {}) {
    const consulta = parametros({ q: nombre, skill: competencia, career: carrera, available: disponibilidad === "" ? "" : disponibilidad === "si", sort: orden, page: pagina, size: tamano })
    const datos = await solicitar(`users?${consulta}`, { signal })
    return { usuarios: datos.items, total: datos.total, pagina: datos.page, totalPaginas: datos.totalPages }
}
