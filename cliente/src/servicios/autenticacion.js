import { simularRespuesta } from "./simulacion.js"

// Cuentas ficticias: se pierden al recargar la página.
let cuentas = []

async function prepararSimulacion() {
    if (!import.meta.env.DEV) {
        throw new Error("La autenticación real todavía no está conectada.")
    }

    await simularRespuesta(null)
}

export async function registrarUsuario({ nombre, correo, contrasena }) {
    await prepararSimulacion()

    const correoNormalizado = correo.trim().toLowerCase()
    const existe = cuentas.some((cuenta) => cuenta.correo === correoNormalizado)

    if (existe) {
        throw new Error("Ya existe una cuenta con ese correo.")
    }

    const usuario = {
        id: crypto.randomUUID(),
        nombre: nombre.trim(),
        correo: correoNormalizado
    }

    cuentas = [...cuentas, { ...usuario, contrasena }]

    return usuario
}

export async function iniciarSesion({ correo, contrasena }) {
    await prepararSimulacion()

    const cuenta = cuentas.find((actual) => {
        return actual.correo === correo.trim().toLowerCase() &&
            actual.contrasena === contrasena
    })

    if (!cuenta) {
        throw new Error("El correo o la contraseña son incorrectos.")
    }

    return { id: cuenta.id, nombre: cuenta.nombre, correo: cuenta.correo }
}
