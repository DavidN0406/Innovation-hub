import { solicitar } from "./api.js"
export const tiposIniciativa = ["Idea", "Necesidad", "Reto"]
export const estadosIniciativa = ["Borrador", "Publicada", "En formación de equipo", "Convertida", "Archivada"]

async function cargarLista(ruta, signal) {
    const elementos = []
    let pagina = 1
    let totalPaginas
    do {
        const datos = await solicitar(`${ruta}?page=${pagina}&size=100`, { signal })
        elementos.push(...datos.items.map(item => item.nombre))
        totalPaginas = datos.totalPages
        pagina += 1
    } while (pagina <= totalPaginas)
    return elementos
}
export async function cargarCatalogos(signal) {
    const [competencias, categorias] = await Promise.all([cargarLista("skills", signal), cargarLista("categories", signal)])
    return { competencias, categorias }
}
