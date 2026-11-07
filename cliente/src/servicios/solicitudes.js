import { peticion, parametros, segmento } from './participacion/transporte.js'
export const listarSolicitudes = (filtros, opciones) => peticion(`requests?${parametros(filtros)}`, opciones)
export const crearSolicitud = (id, datos, opciones) => peticion(`initiatives/${segmento(id)}/requests`, { ...opciones, method: 'POST', body: datos })
export const editarSolicitud = (id, datos, opciones) => peticion(`requests/${segmento(id)}`, { ...opciones, method: 'PUT', body: datos })
export const cambiarEstadoSolicitud = (id, estado, opciones) => peticion(`requests/${segmento(id)}/status`, { ...opciones, method: 'PATCH', body: { estado } })
export const listarIniciativasParticipacion = (filtros, opciones) => peticion(`initiatives?${parametros(filtros)}`, opciones)
