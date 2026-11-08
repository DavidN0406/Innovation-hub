import { categoriasIniciativa, competenciasCatalogo, tiposIniciativa } from "../datos/iniciativasSimuladas.js"

// Se conservan los campos y límites utilizados en el formulario del avance 1.
// Los cuatro niveles definitivos se acordarán en el contrato general de la API.
export const visibilidadesIniciativa = [
    { valor: "publica", texto: "Pública" },
    { valor: "restringida", texto: "Restringida" }
]

export function validarIniciativa(datos = {}) {
    datos = datos ?? {}
    const errores = {}
    const limites = [
        ["titulo", 5, 80], ["resumen", 20, 200], ["descripcion", 30, 1000],
        ["problema", 15, 500], ["beneficiarios", 3, 150]
    ]
    for (const [campo, minimo, maximo] of limites) {
        if (typeof datos[campo] !== "string" || datos[campo].trim().length < minimo || datos[campo].trim().length > maximo) {
            errores[campo] = `Escriba entre ${minimo} y ${maximo} caracteres.`
        }
    }
    if (!tiposIniciativa.includes(datos.tipo)) errores.tipo = "Seleccione un tipo válido."
    if (!categoriasIniciativa.includes(datos.categoria)) errores.categoria = "Seleccione una categoría válida."
    if (!visibilidadesIniciativa.some((opcion) => opcion.valor === datos.visibilidad)) {
        errores.visibilidad = "Seleccione un nivel de visibilidad."
    }
    if (!Number.isInteger(datos.participantesEstimados) || datos.participantesEstimados < 1 || datos.participantesEstimados > 50) {
        errores.participantesEstimados = "Indique un número entero entre 1 y 50."
    }
    if (!Array.isArray(datos.competencias) || datos.competencias.length === 0 ||
        !datos.competencias.every((competencia) => competenciasCatalogo.includes(competencia))) {
        errores.competencias = "Seleccione al menos una competencia de la lista."
    }
    if (!Array.isArray(datos.etiquetas) || datos.etiquetas.length > 5 ||
        !datos.etiquetas.every((etiqueta) => typeof etiqueta === "string" && etiqueta.trim().length > 0 && etiqueta.trim().length <= 20)) {
        errores.etiquetas = "Use hasta 5 etiquetas, de 1 a 20 caracteres cada una."
    }
    return errores
}

export function normalizarIniciativa(datos) {
    // Selección explícita: el formulario no puede cambiar propietario, equipo, estado ni identificador.
    return {
        titulo: datos.titulo.trim(), tipo: datos.tipo, categoria: datos.categoria,
        resumen: datos.resumen.trim(), descripcion: datos.descripcion.trim(),
        problema: datos.problema.trim(), beneficiarios: datos.beneficiarios.trim(),
        participantesEstimados: datos.participantesEstimados, visibilidad: datos.visibilidad,
        competencias: [...new Set(datos.competencias)],
        etiquetas: [...new Set(datos.etiquetas.map((etiqueta) => etiqueta.trim()))]
    }
}
