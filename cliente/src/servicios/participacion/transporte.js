const entorno = import.meta.env ?? {}
export const modoSimulado = entorno.DEV === true && entorno.VITE_PARTICIPACION_MOCK === 'true'

export async function peticion(ruta, { method = 'GET', body, usuario, signal } = {}) {
  if (modoSimulado) {
    const { simularParticipacion } = await import('./simulador.js')
    await new Promise(resolve => setTimeout(resolve, 150))
    signal?.throwIfAborted()
    return simularParticipacion(ruta, { method, body, usuario })
  }
  if (!entorno.VITE_API_URL) throw new Error('Falta configurar VITE_API_URL.')
  let respuesta
  try {
    respuesta = await fetch(`${entorno.VITE_API_URL.replace(/\/$/, '')}/${ruta.replace(/^\//, '')}`, {
      method, credentials: 'include', signal,
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.')
  }
  if (respuesta.status === 204 && respuesta.ok) return null
  let datos
  try { datos = await respuesta.json() } catch {
    throw Object.assign(new Error('El servidor devolvió una respuesta JSON inválida.'), { estado: respuesta.status })
  }
  if (!respuesta.ok) throw Object.assign(new Error(datos?.error?.message || `No se pudo completar la operación (${respuesta.status}).`), {
    estado: respuesta.status, campos: datos?.error?.fields ?? {}
  })
  return datos
}

export function parametros(filtros = {}) {
  return new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor !== '' && valor != null)).toString()
}
export const segmento = id => encodeURIComponent(String(id))
