import { solicitar } from "./api.js"

export function registrarUsuario(datos, { signal } = {}) {
    return solicitar("auth/register", { method: "POST", body: datos, signal })
}
export function iniciarSesion({ correo, contrasena }, { signal } = {}) {
    return solicitar("auth/login", { method: "POST", body: { correo, contrasena }, signal })
}
export async function consultarSesion({ signal } = {}) {
    try { return await solicitar("auth/me", { signal }) } catch (error) {
        if (error.estado === 401) return null
        throw error
    }
}
export async function cerrarSesion({ signal } = {}) {
    try { await solicitar("auth/logout", { method: "POST", signal }) } catch (error) {
        // Una sesión que ya expiró también queda cerrada en la interfaz.
        if (error.estado !== 401) throw error
    }
}
