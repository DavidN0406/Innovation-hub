import { iniciativasIniciales } from "../datos/iniciativasSimuladas.js"
import { simularRespuesta } from "./simulacion.js"

const iniciativas = structuredClone(iniciativasIniciales)

function normalizar(texto) {
    return texto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export async function buscarIniciativas({
    texto = "", tipo = "", categoria = "", competencia = "",
    orden = "fecha-desc", pagina = 1, tamano = 3
} = {}) {
    if (!import.meta.env.DEV) {
        throw new Error("El catálogo todavía no está conectado con la API real.")
    }

    await simularRespuesta(null)
    const busqueda = normalizar(texto)

    // Este catálogo de prueba muestra solo las iniciativas públicas.
    // Los cuatro niveles de acceso se integrarán según el contrato de la API.
    const encontradas = iniciativas.filter((iniciativa) => {
        const coincideTexto = normalizar(iniciativa.titulo).includes(busqueda) ||
            normalizar(iniciativa.resumen).includes(busqueda)

        return iniciativa.visibilidad === "publica" &&
            iniciativa.estado !== "Archivada" &&
            coincideTexto &&
            (!tipo || iniciativa.tipo === tipo) &&
            (!categoria || iniciativa.categoria === categoria) &&
            (!competencia || iniciativa.competencias.includes(competencia))
    })

    const ordenadas = [...encontradas].sort((a, b) => {
        let comparacion
        if (orden === "titulo-asc" || orden === "titulo-desc") {
            comparacion = a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" })
            if (orden === "titulo-desc") comparacion *= -1
        } else {
            comparacion = a.fechaPublicacion.localeCompare(b.fechaPublicacion)
            if (orden !== "fecha-asc") comparacion *= -1
        }
        return comparacion || String(a.id).localeCompare(String(b.id))
    })

    const limite = Number.isInteger(tamano) && tamano > 0 ? tamano : 3
    const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / limite))
    const solicitada = Number.isInteger(pagina) ? pagina : 1
    const paginaActual = Math.min(Math.max(1, solicitada), totalPaginas)
    const inicio = (paginaActual - 1) * limite

    return structuredClone({
        iniciativas: ordenadas.slice(inicio, inicio + limite),
        total: ordenadas.length,
        pagina: paginaActual,
        totalPaginas
    })
}
