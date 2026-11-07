export const estadosSolicitud = ['pendiente', 'aceptada', 'rechazada', 'cancelada']
export const estadosProyecto = ['planificado', 'en_progreso', 'finalizado']

export function validarSolicitud(datos) {
  const errores = {}
  if (typeof datos.mensaje !== 'string' || !datos.mensaje.trim() || datos.mensaje.trim().length > 2000)
    errores.mensaje = 'Escriba una motivación de 1 a 2000 caracteres.'
  if (!Array.isArray(datos.competencias) || !datos.competencias.length ||
      datos.competencias.some(valor => typeof valor !== 'string' || !valor.trim() || valor.length > 100))
    errores.competencias = 'Indique al menos una competencia (máximo 100 caracteres cada una).'
  if (typeof datos.disponibilidad !== 'string' || !datos.disponibilidad.trim() || datos.disponibilidad.length > 300)
    errores.disponibilidad = 'Indique su disponibilidad (máximo 300 caracteres).'
  return errores
}

export function esRepositorioGitHub(valor) {
  try {
    const url = new URL(valor)
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.port &&
      !url.username && !url.password && !url.search && !url.hash &&
      /^\/[\w.-]+\/[\w.-]+\/?$/.test(url.pathname)
  } catch { return false }
}

export function validarProyecto(datos) {
  const errores = {}
  for (const [campo, limite] of [['nombre', 150], ['descripcion', 4000], ['objetivo', 2000]]) {
    if (typeof datos[campo] !== 'string' || !datos[campo].trim() || datos[campo].trim().length > limite)
      errores[campo] = `Este campo es obligatorio y admite hasta ${limite} caracteres.`
  }
  if (typeof datos.fechaInicio !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(datos.fechaInicio) ||
      !Number.isFinite(Date.parse(datos.fechaInicio)) ||
      new Date(datos.fechaInicio).toISOString().slice(0, 10) !== datos.fechaInicio)
    errores.fechaInicio = 'Seleccione una fecha válida.'
  if (!estadosProyecto.includes(datos.estado)) errores.estado = 'Seleccione un estado válido.'
  if (datos.repositorio && !esRepositorioGitHub(datos.repositorio))
    errores.repositorio = 'Use https://github.com/propietario/repositorio, sin parámetros.'
  return errores
}
