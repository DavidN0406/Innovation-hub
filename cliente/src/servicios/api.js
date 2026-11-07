// Realiza peticiones a la API y controla los errores.
export async function solicitar(ruta, opciones = {}) {
  const urlBase = import.meta.env.VITE_API_URL

  if (!urlBase) {
    throw new Error('Falta configurar VITE_API_URL.')
  }

  const url = `${urlBase.replace(/\/$/, '')}/${ruta.replace(/^\//, '')}`

  let respuesta

  try {
    respuesta = await fetch(url, opciones)
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    throw new Error('No se pudo conectar con el servidor.')
  }

  // Algunas operaciones exitosas no devuelven contenido.
  if (respuesta.status === 204) {
    return null
  }

  let datos

  try {
    datos = await respuesta.json()
  } catch {
    throw new Error('El servidor no devolvió una respuesta JSON válida.')
  }

  if (!respuesta.ok) {
    const error = new Error(
      `No se pudo completar la solicitud. Código: ${respuesta.status}.`
    )

    error.estado = respuesta.status
    error.datos = datos

    throw error
  }

  return datos
}