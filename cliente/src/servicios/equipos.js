import { peticion, segmento } from './participacion/transporte.js'
export const consultarEquipo = (id, opciones) => peticion(`initiatives/${segmento(id)}/team`, opciones)
export const retirarIntegrante = (id, usuarioId, opciones) => peticion(`initiatives/${segmento(id)}/team/${segmento(usuarioId)}`, { ...opciones, method: 'DELETE' })
