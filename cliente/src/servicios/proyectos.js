import { peticion, parametros, segmento } from './participacion/transporte.js'
export const convertirIniciativa = (id, datos, opciones) => peticion(`initiatives/${segmento(id)}/projects`, { ...opciones, method: 'POST', body: datos })
export const listarProyectos = (filtros, opciones) => peticion(`projects?${parametros(filtros)}`, opciones)
export const consultarProyecto = (id, opciones) => peticion(`projects/${segmento(id)}`, opciones)
