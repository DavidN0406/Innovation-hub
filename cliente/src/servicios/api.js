// Todas las operaciones usan la cookie de sesión del servidor.
export function crearClienteApi({ urlBase, fetchImpl = fetch }) {
    return async function solicitar(ruta, { body, headers, ...opciones } = {}) {
        if (!urlBase) throw new Error("Falta configurar VITE_API_URL.")
        let respuesta
        try {
            respuesta = await fetchImpl(`${urlBase.replace(/\/$/, "")}/${ruta.replace(/^\//, "")}`, {
                ...opciones, credentials: "include",
                headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers },
                ...(body === undefined ? {} : { body: JSON.stringify(body) })
            })
        } catch (error) {
            if (opciones.signal?.aborted || error.name === "AbortError") throw error
            throw new Error("No se pudo conectar con el servidor. Compruebe que la API esté iniciada.")
        }
        if (respuesta.ok && respuesta.status === 204) return null
        let datos
        try { datos = await respuesta.json() } catch {
            throw Object.assign(new Error("El servidor no devolvió JSON válido."), { estado: respuesta.status })
        }
        if (!respuesta.ok) throw Object.assign(new Error(datos?.error?.message || `Error del servidor (${respuesta.status}).`), {
            estado: respuesta.status, campos: datos?.error?.fields ?? {}
        })
        return datos
    }
}
export const solicitar = crearClienteApi({ urlBase: import.meta.env?.VITE_API_URL })
export const segmento = id => encodeURIComponent(String(id))
export const parametros = filtros => new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor !== "" && valor != null)).toString()
