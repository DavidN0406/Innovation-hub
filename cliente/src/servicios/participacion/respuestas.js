const objeto = valor => valor != null && typeof valor === 'object' && !Array.isArray(valor)
const texto = valor => typeof valor === 'string'
const identificador = valor => texto(valor) && valor.length > 0
const iniciativa = valor => objeto(valor) && identificador(valor.id) && texto(valor.titulo) && texto(valor.estado) && identificador(valor.propietarioId)
const solicitud = valor => objeto(valor) && identificador(valor.id) && identificador(valor.iniciativaId) && iniciativa(valor.iniciativa) && identificador(valor.solicitanteId) && texto(valor.solicitanteNombre) && texto(valor.mensaje) && Array.isArray(valor.competencias) && valor.competencias.every(texto) && texto(valor.disponibilidad) && texto(valor.estado)
const proyecto = valor => objeto(valor) && identificador(valor.id) && identificador(valor.iniciativaId) && iniciativa(valor.iniciativa) && ['nombre', 'descripcion', 'objetivo', 'fechaInicio', 'estado'].every(campo => texto(valor[campo])) && (valor.repositorio === null || texto(valor.repositorio))

export function validarRespuesta(ruta, method, datos) {
  const partes = ruta.split('?')[0].replace(/^\//, '').split('/')
  let correcta = false
  if (method === 'DELETE') correcta = datos === null
  else if (partes[0] === 'initiatives' && partes[2] === 'team') {
    correcta = objeto(datos) && iniciativa(datos.iniciativa) && typeof datos.puedeRetirar === 'boolean' && Array.isArray(datos.miembros) && datos.miembros.every(m => objeto(m) && identificador(m.usuarioId) && texto(m.nombre) && texto(m.rol))
  } else if (method === 'GET' && partes.length === 1) {
    const validar = { initiatives: iniciativa, requests: solicitud, projects: proyecto }[partes[0]]
    correcta = Boolean(validar) && objeto(datos) && Array.isArray(datos.items) && datos.items.every(validar) && Number.isInteger(datos.total) && datos.total >= 0 && Number.isInteger(datos.page) && datos.page > 0 && Number.isInteger(datos.size) && datos.size > 0 && Number.isInteger(datos.totalPages) && datos.totalPages > 0
  } else correcta = partes[0] === 'projects' || partes[2] === 'projects' ? proyecto(datos) : solicitud(datos)
  if (!correcta) throw new Error('El servidor devolvió datos incompletos o con un formato inválido.')
  return datos
}
