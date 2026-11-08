import mongoose from 'mongoose'; // Proporciona transacciones compartidas entre los modelos de una operacion.
import { Iniciativa } from './modelos.js'; // Centraliza el bloqueo de las escrituras relacionadas con una iniciativa.

export function consultarUno(Modelo, filtro, sesion = null) { // Encapsula el acceso de lectura a una coleccion.
  return Modelo.findOne(filtro).session(sesion); // Vincula la consulta a la transaccion cuando existe una.
}

export function transaccion(operacion) { // Ejecuta escrituras relacionadas como una sola unidad atomica.
  return mongoose.connection.transaction(operacion); // Revierte todo si hay un error y reintenta conflictos temporales segun el driver.
}

export function bloquearIniciativa(id, sesion) { // Serializa cambios de solicitudes, equipo, edicion, archivo y conversion de la misma iniciativa.
  return Iniciativa.findOneAndUpdate({ _id: id }, { $inc: { revision: 1 } }, { new: true, session: sesion }); // Fuerza un conflicto de escritura si otra transaccion cambio el equipo al mismo tiempo.
}

export async function paginarAgregado(Modelo, etapas, orden, page, size) { // Pagina relaciones filtradas por permisos mediante agregacion en MongoDB.
  const [resultado] = await Modelo.aggregate([...etapas, { $facet: { items: [{ $sort: orden }, { $skip: (page - 1) * size }, { $limit: size }], cuenta: [{ $count: 'total' }] } }]); // Filtra y une documentos antes del conteo y del limite.
  const total = resultado.cuenta[0]?.total ?? 0; // Trata correctamente una consulta sin coincidencias.
  return { items: resultado.items.map(item => Modelo.hydrate(item)), total, page, size, totalPages: Math.max(1, Math.ceil(total / size)) }; // Convierte solamente la pagina solicitada en documentos del modelo.
}

export async function insertar(Modelo, datos, sesion = null) { // Crea documentos desde datos previamente validados por los servicios.
  const documento = new Modelo(datos); // Aplica los tipos, valores predeterminados e indices del modelo.
  return documento.save({ session: sesion }); // Persiste el registro y propaga los errores al middleware central.
}

export async function paginar(Modelo, filtro, orden, page, size, proyeccion = null) { // Resuelve listados sin descargar la coleccion completa al servidor o al navegador.
  const [items, total] = await Promise.all([Modelo.find(filtro, proyeccion).sort(orden).skip((page - 1) * size).limit(size), Modelo.countDocuments(filtro)]); // Ejecuta pagina y conteo independientes con el mismo filtro.
  return { items, total, page, size, totalPages: Math.max(1, Math.ceil(total / size)) }; // Conserva el numero solicitado incluso para paginas vacias.
}
