// Simula una respuesta para desarrollar sin el servidor.
export async function simularRespuesta(datos, mensajeError = '') {
  // La espera permite comprobar el estado de carga.
  await new Promise((resolver) => {
    setTimeout(resolver, 300)
  })

  if (mensajeError) {
    throw new Error(mensajeError)
  }

  // Devuelve una copia para no modificar los datos originales.
  return structuredClone(datos)
}