import { iniciativasIniciales } from "../datos/iniciativasSimuladas.js"
import { simularRespuesta } from "./simulacion.js"
import { normalizarIniciativa, validarIniciativa } from "./validacionIniciativa.js"

let iniciativas = structuredClone(iniciativasIniciales)

function errorNoDisponible() {
    const error = new Error("La iniciativa no existe o no está disponible.")
    error.estado = 404
    return error
}

function fallo(estado, mensaje, campos = {}) {
    return Object.assign(new Error(mensaje), { estado, campos })
}

async function esperarRespuesta(signal) {
    if (!import.meta.env.DEV) {
        throw new Error("Los servicios de iniciativas todavía no están conectados con la API real.")
    }
    signal?.throwIfAborted()
    await simularRespuesta(null)
    signal?.throwIfAborted()
}

function exigirUsuario(usuario) {
    if (!usuario?.id || typeof usuario.nombre !== "string" || !usuario.nombre.trim()) {
        throw fallo(401, "Inicie sesión para continuar.")
    }
}

function obtenerPropia(id, usuario) {
    exigirUsuario(usuario)
    const iniciativa = iniciativas.find((actual) => String(actual.id) === String(id))
    if (!iniciativa) throw errorNoDisponible()
    if (String(iniciativa.propietarioId) !== String(usuario.id)) {
        throw fallo(403, "Solo el propietario puede modificar esta iniciativa.")
    }
    return iniciativa
}

function comprobarFormulario(datos) {
    const campos = validarIniciativa(datos)
    if (Object.keys(campos).length) throw fallo(400, "Revise los campos indicados.", campos)
}

function normalizar(texto) {
    return texto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export async function buscarIniciativas({
    texto = "", tipo = "", categoria = "", competencia = "",
    orden = "fecha-desc", pagina = 1, tamano = 3,
    soloPropias = false, incluirArchivadas = false
} = {}, { usuarioId = null, signal } = {}) {
    await esperarRespuesta(signal)
    if (soloPropias && !usuarioId) throw fallo(401, "Inicie sesión para consultar sus iniciativas.")
    if (incluirArchivadas && !soloPropias) throw fallo(400, "Las archivadas solo se consultan entre sus propias iniciativas.")
    const busqueda = normalizar(texto)

    // Catálogo público o iniciativas del propietario actual, incluidas las restringidas.
    // Los permisos reales y los cuatro niveles se implementarán en la API.
    const encontradas = iniciativas.filter((iniciativa) => {
        const coincideTexto = normalizar(iniciativa.titulo).includes(busqueda) ||
            normalizar(iniciativa.resumen).includes(busqueda)

        const visible = soloPropias
            ? String(iniciativa.propietarioId) === String(usuarioId)
            : iniciativa.visibilidad === "publica"
        return visible &&
            (incluirArchivadas || iniciativa.estado !== "Archivada") &&
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

// Simula los niveles del avance 1. La API real determinará los permisos
// de los cuatro niveles; recibir un usuarioId aquí no autentica a nadie.
export async function consultarIniciativa(id, usuarioId = null, { signal } = {}) {
    await esperarRespuesta(signal)
    const iniciativa = iniciativas.find((actual) => String(actual.id) === String(id))
    if (!iniciativa) throw errorNoDisponible()

    const esPropietario = usuarioId != null && iniciativa.propietarioId != null &&
        String(iniciativa.propietarioId) === String(usuarioId)
    const esMiembro = usuarioId != null && iniciativa.equipo.some((miembro) =>
        miembro.usuarioId != null && String(miembro.usuarioId) === String(usuarioId))
    const archivada = iniciativa.estado === "Archivada"
    const cerrada = archivada || iniciativa.estado === "Convertida"
    const accesoCompleto = iniciativa.visibilidad === "publica" || esPropietario

    if ((archivada && !esPropietario) ||
        (!accesoCompleto && iniciativa.visibilidad !== "restringida")) {
        throw errorNoDisponible()
    }

    const tieneOtroMiembro = iniciativa.equipo.some((miembro) =>
        miembro.usuarioId != null && String(miembro.usuarioId) !== String(iniciativa.propietarioId))

    const permisos = {
        puedeEditar: esPropietario && !cerrada,
        puedeArchivar: esPropietario && !archivada,
        puedeSolicitar: usuarioId != null && !esPropietario && !esMiembro && !cerrada,
        puedeVerEquipo: accesoCompleto,
        puedeConvertir: esPropietario && tieneOtroMiembro && !cerrada,
        faltaMiembroParaConvertir: esPropietario && !tieneOtroMiembro && !cerrada
    }

    // La pantalla recibe solo el resumen cuando no tiene acceso completo.
    const datos = accesoCompleto ? iniciativa : {
        id: iniciativa.id,
        titulo: iniciativa.titulo,
        tipo: iniciativa.tipo,
        categoria: iniciativa.categoria,
        estado: iniciativa.estado,
        visibilidad: iniciativa.visibilidad,
        resumen: iniciativa.resumen
    }

    return structuredClone({ ...datos, accesoCompleto, permisos })
}


// Operaciones de desarrollo en memoria. La API verificará la sesión y propiedad reales.
export async function crearIniciativa(datos, usuario, { signal } = {}) {
    await esperarRespuesta(signal)
    exigirUsuario(usuario)
    comprobarFormulario(datos)
    const nueva = {
        ...normalizarIniciativa(datos),
        id: crypto.randomUUID(), propietarioId: usuario.id, autor: usuario.nombre,
        fechaPublicacion: new Date().toISOString().slice(0, 10), estado: "Abierta",
        equipo: [{ usuarioId: usuario.id, nombre: usuario.nombre, rol: "Propietario" }]
    }
    iniciativas = [...iniciativas, nueva]
    return structuredClone(nueva)
}

export async function actualizarIniciativa(id, datos, usuario, { signal } = {}) {
    await esperarRespuesta(signal)
    const actual = obtenerPropia(id, usuario)
    if (["Archivada", "Convertida"].includes(actual.estado)) {
        throw fallo(409, "Esta iniciativa ya está archivada o convertida y no admite edición.")
    }
    comprobarFormulario(datos)
    const actualizada = { ...actual, ...normalizarIniciativa(datos) }
    iniciativas = iniciativas.map((iniciativa) => String(iniciativa.id) === String(id) ? actualizada : iniciativa)
    return structuredClone(actualizada)
}

export async function archivarIniciativa(id, usuario, { signal } = {}) {
    await esperarRespuesta(signal)
    const actual = obtenerPropia(id, usuario)
    if (actual.estado === "Archivada") throw fallo(409, "La iniciativa ya está archivada.")
    // Se conserva la información y sus relaciones; no se realiza eliminación física.
    const archivada = { ...actual, estado: "Archivada" }
    iniciativas = iniciativas.map((iniciativa) => String(iniciativa.id) === String(id) ? archivada : iniciativa)
    return structuredClone(archivada)
}
