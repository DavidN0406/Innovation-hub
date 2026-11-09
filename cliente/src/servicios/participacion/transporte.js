import { validarRespuesta } from './respuestas.js'

const entorno = import.meta.env ?? {}
export const modoSimulado = entorno.DEV === true && entorno.VISTA_GUSTAVO === true && entorno.VITE_PARTICIPACION_MOCK === 'true'

export function crearTransporte({ entorno, fetchImpl = fetch }) {
return async function peticion(ruta, { method = 'GET', body, usuario, signal } = {}) {
  if (entorno.DEV === true && entorno.VISTA_GUSTAVO === true && entorno.VITE_PARTICIPACION_MOCK === 'true') {
    const { simularParticipacion } = await import('./simulador.js')
    await new Promise(resolve => setTimeout(resolve, 150))
    signal?.throwIfAborted()
    return validarRespuesta(ruta, method, await simularParticipacion(ruta, { method, body, usuario }))
  }
  if (!entorno.VITE_API_URL) throw new Error('Falta configurar VITE_API_URL.')
  let respuesta
  try {
    respuesta = await fetchImpl(`${entorno.VITE_API_URL.replace(/\/$/, '')}/${ruta.replace(/^\//, '')}`, {
      method, credentials: 'include', signal,
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.')
  }
  if (respuesta.status === 204 && respuesta.ok) return validarRespuesta(ruta, method, null)
  let datos
  try { datos = await respuesta.json() } catch {
    throw Object.assign(new Error('El servidor devolvió una respuesta JSON inválida.'), { estado: respuesta.status })
  }
  if (!respuesta.ok) throw Object.assign(new Error(datos?.error?.message || `No se pudo completar la operación (${respuesta.status}).`), {
    estado: respuesta.status, campos: datos?.error?.fields ?? {}
  })
  return validarRespuesta(ruta, method, datos)
}
}

export const peticion = crearTransporte({ entorno })

export function parametros(filtros = {}) {
  return new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor !== '' && valor != null)).toString()
}
export const segmento = id => encodeURIComponent(String(id))
