import { competenciasDisponibles, usuariosIniciales } from "../datos/usuariosSimulados.js"
import { simularRespuesta } from "./simulacion.js"

// Solo existe en memoria. La API reemplazará esta simulación al integrar.
let perfiles = structuredClone(usuariosIniciales)

function verificarModoPrueba() {
    if (!import.meta.env.DEV) {
        throw new Error("Los servicios reales de usuarios todavía no están conectados.")
    }
}

async function esperarRespuesta() {
    verificarModoPrueba()
    await simularRespuesta(null)
}

function normalizar(texto) {
    return texto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

// El registro crea el perfil que después se consulta, edita y busca.
export function crearPerfilSimulado({ id, nombre, correo }) {
    verificarModoPrueba()
    if (perfiles.some((actual) => actual.correo === correo)) {
        throw new Error("Ya existe una cuenta con ese correo.")
    }
    const perfil = {
        id, nombre, correo, rol: "Estudiante", carrera: "",
        disponible: true, competencias: [], intereses: []
    }
    perfiles = [...perfiles, perfil]
    return structuredClone(perfil)
}

export async function consultarPerfil(id) {
    await esperarRespuesta()
    const perfil = perfiles.find((actual) => actual.id === id)
    if (!perfil) throw new Error("No se encontró el perfil.")
    return structuredClone(perfil)
}

export async function actualizarPerfil(id, cambios) {
    await esperarRespuesta()
    const actual = perfiles.find((perfil) => perfil.id === id)
    if (!actual) throw new Error("No se encontró el perfil.")

    if (cambios.correo !== undefined && cambios.correo !== actual.correo) {
        throw new Error("El correo no se puede modificar.")
    }
    if (typeof cambios.nombre !== "string" || !cambios.nombre.trim()) {
        throw new Error("Escriba su nombre.")
    }
    if (typeof cambios.carrera !== "string" || !cambios.carrera.trim()) {
        throw new Error("Escriba su carrera.")
    }
    if (typeof cambios.disponible !== "boolean") {
        throw new Error("Seleccione su disponibilidad.")
    }
    if (!Array.isArray(cambios.competencias) ||
        !cambios.competencias.every((valor) => competenciasDisponibles.includes(valor))) {
        throw new Error("Seleccione competencias de la lista.")
    }
    if (!Array.isArray(cambios.intereses) ||
        !cambios.intereses.every((valor) => typeof valor === "string")) {
        throw new Error("Revise los intereses ingresados.")
    }

    // Solo se cambian los campos editables; se conservan id, correo y rol.
    const actualizado = {
        ...actual,
        nombre: cambios.nombre.trim(),
        carrera: cambios.carrera.trim(),
        disponible: cambios.disponible,
        competencias: cambios.competencias.filter((valor, indice, lista) => lista.indexOf(valor) === indice),
        intereses: cambios.intereses.map((valor) => valor.trim()).filter(Boolean)
    }
    perfiles = perfiles.map((perfil) => perfil.id === id ? actualizado : perfil)
    return structuredClone(actualizado)
}

export async function buscarUsuarios({
    nombre = "", competencia = "", carrera = "", disponibilidad = "",
    orden = "nombre-asc", pagina = 1, tamano = 3
} = {}) {
    await esperarRespuesta()

    const encontrados = perfiles.filter((perfil) => {
        return normalizar(perfil.nombre).includes(normalizar(nombre)) &&
            normalizar(perfil.carrera).includes(normalizar(carrera)) &&
            (!competencia || perfil.competencias.includes(competencia)) &&
            (disponibilidad === "" || perfil.disponible === (disponibilidad === "si"))
    })

    const ordenados = [...encontrados].sort((a, b) => {
        const comparacion = a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
        return orden === "nombre-desc" ? -comparacion : comparacion
    })

    const limite = Number.isInteger(tamano) && tamano > 0 ? tamano : 3
    const totalPaginas = Math.max(1, Math.ceil(ordenados.length / limite))
    const solicitada = Number.isInteger(pagina) ? pagina : 1
    const paginaActual = Math.min(Math.max(1, solicitada), totalPaginas)
    const inicio = (paginaActual - 1) * limite

    return structuredClone({
        usuarios: ordenados.slice(inicio, inicio + limite),
        total: ordenados.length,
        pagina: paginaActual,
        totalPaginas
    })
}
