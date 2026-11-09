export const estadosSolicitud = ['pendiente', 'aceptada', 'rechazada', 'cancelada']
export const estadosProyecto = ['planificado', 'en_progreso', 'pausado', 'finalizado', 'archivado']

export function validarSolicitud(datos) {
  const errores = {}
  if (typeof datos.mensaje !== 'string' || !datos.mensaje.trim() || datos.mensaje.trim().length > 2000)
    errores.mensaje = 'Escriba una motivación de 1 a 2000 caracteres.'
  if (!Array.isArray(datos.competencias) || !datos.competencias.length ||
      datos.competencias.some(valor => typeof valor !== 'string' || !valor.trim() || valor.length > 100))
    errores.competencias = 'Indique al menos una competencia (máximo 100 caracteres cada una).'
  if (typeof datos.disponibilidad !== 'string' || !datos.disponibilidad.trim() || datos.disponibilidad.length > 300)
    errores.disponibilidad = 'Indique su disponibilidad (máximo 300 caracteres).'
  if (datos.rolSolicitado !== undefined && (typeof datos.rolSolicitado !== 'string' || !datos.rolSolicitado.trim() || datos.rolSolicitado.trim().length > 100))
    errores.rolSolicitado = 'Indique un rol de 1 a 100 caracteres.'
  if (Array.isArray(datos.competencias) && datos.competencias.length > 30) errores.competencias = 'Seleccione hasta 30 competencias.'
  return errores
}

export function esRepositorioGitHub(valor) {
  try {
    const url = new URL(valor)
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.port &&
      !url.username && !url.password && !url.search && !url.hash &&
      /^\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.pathname)
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
  if (datos.fechaFinEstimada && (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fechaFinEstimada) ||
      !Number.isFinite(Date.parse(datos.fechaFinEstimada)) || new Date(datos.fechaFinEstimada).toISOString().slice(0, 10) !== datos.fechaFinEstimada ||
      datos.fechaFinEstimada < datos.fechaInicio)) errores.fechaFinEstimada = 'Use una fecha válida igual o posterior al inicio.'
  if (datos.tecnologias !== undefined && (!Array.isArray(datos.tecnologias) || datos.tecnologias.length > 30 ||
      datos.tecnologias.some(t => typeof t !== 'string' || !t.trim() || t.trim().length > 100))) errores.tecnologias = 'Use hasta 30 tecnologías de 1 a 100 caracteres.'
  return errores
}
