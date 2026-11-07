import { iniciativasIniciales } from '../../datos/iniciativasSimuladas.js'
import { estadosSolicitud, validarSolicitud, validarProyecto } from './validacion.js'

export const personasPrueba = [
  { id: 'demo-1', nombre: 'Ana Solís (solicitante)' },
  { id: 'autor-1', nombre: 'Ana Rojas (propietaria)' },
  { id: 'miembro-1-2', nombre: 'Diego Salas (integrante)' },
  { id: 'demo-2', nombre: 'Bruno Mora (otro usuario)' }
]

export function errorApi(estado, mensaje, campos = {}) {
  return Object.assign(new Error(mensaje), { estado, campos })
}

const igual = (a, b) => String(a) === String(b)
const verificar = (condicion, estado, mensaje) => {
  if (!condicion) throw errorApi(estado, mensaje)
}

// Instancia aislada, sin localStorage. No es un servidor ni autentica usuarios.
export function crearSimulador() {
  let iniciativas = structuredClone(iniciativasIniciales)
  let solicitudes = [{
    id: 'solicitud-demo', iniciativaId: '1', solicitanteId: 'demo-1',
    solicitanteNombre: 'Ana Solís', mensaje: 'Quiero apoyar el desarrollo de la plataforma.',
    competencias: ['React'], disponibilidad: 'Cuatro horas por semana', estado: 'pendiente',
    fechaCreacion: '2026-11-07T12:00:00.000Z'
  }]
  let proyectos = []
  const iniciativa = id => {
    const dato = iniciativas.find(item => igual(item.id, id))
    verificar(dato, 404, 'La iniciativa no existe.')
    return dato
  }
  const propietario = (dato, usuario) => verificar(igual(dato.propietarioId, usuario.id), 403, 'Solo el propietario puede realizar esta acción.')
  const disponible = dato => verificar(!['Archivada', 'Convertida'].includes(dato.estado), 409, 'La iniciativa está archivada o ya fue convertida.')
  const acceso = (dato, usuario) => dato.visibilidad === 'publica' || igual(dato.propietarioId, usuario.id) || dato.equipo.some(m => igual(m.usuarioId, usuario.id))
  const vistaIniciativa = dato => ({ id: String(dato.id), titulo: dato.titulo, estado: dato.estado, propietarioId: dato.propietarioId })
  const vistaSolicitud = dato => ({ ...dato, iniciativa: vistaIniciativa(iniciativa(dato.iniciativaId)) })

  function paginar(items, consulta) {
    const page = Number(consulta.get('page') ?? 1), size = Number(consulta.get('size') ?? 10)
    verificar(Number.isInteger(page) && page > 0 && Number.isInteger(size) && size > 0 && size <= 100, 400, 'Paginación inválida.')
    return { items: items.slice((page - 1) * size, page * size), total: items.length, page, size, totalPages: Math.max(1, Math.ceil(items.length / size)) }
  }
  function validar(datos, validador) {
    const campos = validador(datos)
    if (Object.keys(campos).length) throw errorApi(400, 'Revise los campos indicados.', campos)
  }
  function datosSolicitud(body) {
    validar(body, validarSolicitud)
    return { mensaje: body.mensaje.trim(), competencias: [...new Set(body.competencias.map(c => c.trim()))], disponibilidad: body.disponibilidad.trim() }
  }

  async function ejecutar(ruta, { method = 'GET', body, usuario } = {}) {
    verificar(usuario?.id, 401, 'Inicie sesión para continuar.')
    const url = new URL(ruta, 'http://simulacion.invalid')
    const partes = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
    const [recurso, id, subrecurso, miembroId] = partes
    const consulta = url.searchParams
    if (recurso === 'initiatives') {
      if (!id && method === 'GET') {
        verificar(['owned', 'accessible'].includes(consulta.get('scope') ?? 'accessible'), 400, 'Ámbito inválido.')
        const items = iniciativas.filter(dato => consulta.get('scope') === 'owned'
          ? igual(dato.propietarioId, usuario.id) : acceso(dato, usuario))
        return paginar(items.map(vistaIniciativa).sort((a, b) => a.id.localeCompare(b.id)), consulta)
      }
      const dato = iniciativa(id)
      if (subrecurso === 'requests' && method === 'POST') {
        disponible(dato)
        verificar(acceso(dato, usuario), 403, 'No tiene acceso a la iniciativa.')
        verificar(!igual(dato.propietarioId, usuario.id) && !dato.equipo.some(m => igual(m.usuarioId, usuario.id)), 409, 'Ya pertenece al equipo.')
        verificar(!solicitudes.some(s => igual(s.iniciativaId, id) && igual(s.solicitanteId, usuario.id) && s.estado === 'pendiente'), 409, 'Ya existe una solicitud pendiente para esta iniciativa.')
        const nueva = { ...datosSolicitud(body), id: crypto.randomUUID(), iniciativaId: String(id), solicitanteId: usuario.id, solicitanteNombre: usuario.nombre, estado: 'pendiente', fechaCreacion: new Date().toISOString() }
        solicitudes = [...solicitudes, nueva]
        return vistaSolicitud(nueva)
      }
      if (subrecurso === 'team') {
        verificar(acceso(dato, usuario), 403, 'No tiene acceso al equipo.')
        if (method === 'GET') return { iniciativa: vistaIniciativa(dato), miembros: dato.equipo, puedeRetirar: igual(dato.propietarioId, usuario.id) }
        if (method === 'DELETE' && miembroId) {
          propietario(dato, usuario)
          verificar(!igual(miembroId, dato.propietarioId), 409, 'El propietario no puede retirarse del equipo.')
          verificar(dato.equipo.some(m => igual(m.usuarioId, miembroId)), 404, 'El integrante no existe.')
          iniciativas = iniciativas.map(i => igual(i.id, id) ? { ...i, equipo: i.equipo.filter(m => !igual(m.usuarioId, miembroId)) } : i)
          return null
        }
      }
      if (subrecurso === 'projects' && method === 'POST') {
        propietario(dato, usuario)
        disponible(dato)
        verificar(dato.equipo.some(m => !igual(m.usuarioId, dato.propietarioId)), 409, 'Se requiere al menos otro integrante además del propietario.')
        validar(body, validarProyecto)
        const proyecto = { id: crypto.randomUUID(), iniciativaId: String(id), iniciativa: vistaIniciativa(dato), nombre: body.nombre.trim(), descripcion: body.descripcion.trim(), objetivo: body.objetivo.trim(), fechaInicio: body.fechaInicio, estado: body.estado, repositorio: body.repositorio?.trim() || null }
        proyectos = [...proyectos, proyecto]
        iniciativas = iniciativas.map(i => igual(i.id, id) ? { ...i, estado: 'Convertida' } : i)
        return proyecto
      }
    }
    if (recurso === 'requests') {
      if (!id && method === 'GET') {
        const scope = consulta.get('scope') ?? 'mine', estado = consulta.get('status'), initiativeId = consulta.get('initiativeId')
        verificar(['mine', 'received'].includes(scope) && (!estado || estadosSolicitud.includes(estado)), 400, 'Filtros inválidos.')
        const items = solicitudes.filter(s => (scope === 'mine' ? igual(s.solicitanteId, usuario.id) : igual(iniciativa(s.iniciativaId).propietarioId, usuario.id)) && (!estado || s.estado === estado) && (!initiativeId || igual(s.iniciativaId, initiativeId)))
        return paginar([...items].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion) || a.id.localeCompare(b.id)).map(vistaSolicitud), consulta)
      }
      const actual = solicitudes.find(s => s.id === id)
      verificar(actual, 404, 'La solicitud no existe.')
      const propia = igual(actual.solicitanteId, usuario.id), dato = iniciativa(actual.iniciativaId)
      if (method === 'PUT' && !subrecurso) verificar(propia, 403, 'Solo puede editar sus propias solicitudes.')
      else if (method === 'PATCH' && subrecurso === 'status') {
        if (body?.estado === 'cancelada') verificar(propia, 403, 'Solo el solicitante puede cancelar.')
        else {
          propietario(dato, usuario)
          verificar(['aceptada', 'rechazada'].includes(body?.estado), 400, 'Estado de resolución inválido.')
        }
      } else throw errorApi(404, 'Ruta no disponible.')
      verificar(actual.estado === 'pendiente', 409, 'Solo se pueden modificar solicitudes pendientes.')
      let cambios
      if (method === 'PUT') cambios = datosSolicitud(body)
      else {
        cambios = { estado: body.estado }
        if (body.estado === 'aceptada') {
          disponible(dato)
          verificar(!dato.equipo.some(m => igual(m.usuarioId, actual.solicitanteId)), 409, 'El solicitante ya pertenece al equipo.')
          iniciativas = iniciativas.map(i => igual(i.id, dato.id) ? { ...i, equipo: [...i.equipo, { usuarioId: actual.solicitanteId, nombre: actual.solicitanteNombre, rol: 'Integrante' }] } : i)
        }
      }
      const actualizada = { ...actual, ...cambios }
      solicitudes = solicitudes.map(s => s.id === id ? actualizada : s)
      return vistaSolicitud(actualizada)
    }
    if (recurso === 'projects' && method === 'GET') {
      const visibles = proyectos.filter(p => acceso(iniciativa(p.iniciativaId), usuario))
      if (!id) return paginar([...visibles].sort((a, b) => a.id.localeCompare(b.id)), consulta)
      const proyecto = visibles.find(p => p.id === id)
      verificar(proyecto, 404, 'El proyecto no existe o no está disponible.')
      return proyecto
    }
    throw errorApi(404, 'Ruta no disponible.')
  }
  return async (...args) => structuredClone(await ejecutar(...args))
}

export const simularParticipacion = crearSimulador()
