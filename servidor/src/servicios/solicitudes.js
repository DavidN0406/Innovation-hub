import { Solicitud, Iniciativa, Usuario } from '../datos/modelos.js'; // Relaciona solicitudes con iniciativas y perfiles actuales.
import { consultarUno, insertar, transaccion, bloquearIniciativa, paginarAgregado } from '../datos/repositorio.js'; // Reutiliza persistencia y transacciones para evitar estados parciales.
import { texto, opcion, camposPermitidos, paginacion } from './validacion.js'; // Revalida formularios, decisiones y filtros.
import { exigir } from '../middleware/errores.js'; // Traduce reglas incumplidas a codigos HTTP controlados.
import { puedeExplorar, cerrada, esPropietario, esMiembro, resumenIniciativa } from './permisos.js'; // Comparte reglas de propiedad y acceso con iniciativas.
import { estadosSolicitud } from '../datos/catalogos.js'; // Conserva los estados que ya esperan los componentes de participacion.
import { validarCompetencias } from './usuarios.js'; // Impide ofrecer competencias inexistentes en el catalogo.

async function validarFormulario(datos) { // Prepara los campos que puede crear o modificar un solicitante.
  camposPermitidos(datos, ['mensaje', 'competencias', 'disponibilidad', 'rolSolicitado']); // Protege solicitante, iniciativa, fechas y estado frente a asignacion masiva.
  return { mensaje: texto(datos.mensaje, 'mensaje', 1, 2000), competencias: await validarCompetencias(datos.competencias, 1), disponibilidad: texto(datos.disponibilidad, 'disponibilidad', 1, 300), rolSolicitado: texto(datos.rolSolicitado ?? 'Colaborador', 'rolSolicitado', 1, 100) }; // Usa Colaborador como valor compatible cuando el formulario actual no envia un rol.
}

export async function presentarSolicitud(solicitud, actor) { // Construye la respuesta publica sin copiar documentos completos.
  const iniciativa = await consultarUno(Iniciativa, { _id: solicitud.iniciativaId }); // Recupera el titulo actual de la iniciativa relacionada.
  const solicitante = await consultarUno(Usuario, { _id: solicitud.solicitanteId }); // Resuelve el nombre sin exponer datos de autenticacion.
  const resumen = iniciativa && puedeExplorar(iniciativa, actor) ? resumenIniciativa(iniciativa) : { id: solicitud.iniciativaId, titulo: 'Iniciativa no disponible', estado: 'No disponible', propietarioId: 'no-disponible' }; // Conserva solicitudes propias historicas sin filtrar datos de una iniciativa que ahora es privada.
  return { id: solicitud.id, iniciativaId: solicitud.iniciativaId, iniciativa: resumen, solicitanteId: solicitud.solicitanteId, solicitanteNombre: solicitante?.nombre ?? 'Usuario inactivo', mensaje: solicitud.mensaje, competencias: solicitud.competencias, disponibilidad: solicitud.disponibilidad, rolSolicitado: solicitud.rolSolicitado, estado: solicitud.estado, fechaCreacion: solicitud.fechaCreacion, fechaDecision: solicitud.fechaDecision ?? null, respuesta: solicitud.respuesta }; // Mantiene el formato validado por los servicios de Gustavo.
}

export async function crearSolicitud(id, datos, actor) { // Registra una solicitud propia con identidad tomada de la sesion.
  const validado = await validarFormulario(datos); // Comprueba el contenido antes de bloquear la iniciativa.
  const resultado = await transaccion(async sesion => { // Evita competir con archivo, eliminacion, retiro o conversion.
    const iniciativa = await bloquearIniciativa(texto(id, 'id'), sesion); // Serializa todas las escrituras vinculadas a la misma iniciativa.
    exigir(iniciativa, 404, 'NOT_FOUND', 'Iniciativa no encontrada.'); // Controla recursos inexistentes antes de leer sus campos.
    exigir(puedeExplorar(iniciativa, actor), 403, 'FORBIDDEN', 'No tiene acceso a esta iniciativa.'); // No permite solicitar ingreso mediante un ID privado conocido.
    exigir(!cerrada(iniciativa) && iniciativa.estado !== 'Borrador', 409, 'CONFLICT', 'La iniciativa no recibe solicitudes.'); // Rechaza iniciativas archivadas, convertidas o sin publicar.
    exigir(!esPropietario(iniciativa, actor) && !esMiembro(iniciativa, actor), 409, 'CONFLICT', 'Ya pertenece al equipo de esta iniciativa.'); // Aplica las restricciones de propietario e integrantes actuales.
    exigir(!await consultarUno(Solicitud, { iniciativaId: id, solicitanteId: actor.id, estado: 'pendiente' }, sesion), 409, 'CONFLICT', 'Ya tiene una solicitud pendiente.'); // Complementa el indice unico con un mensaje claro.
    return insertar(Solicitud, { ...validado, iniciativaId: id, solicitanteId: actor.id }, sesion); // Genera fecha, ID y estado pendiente en el servidor.
  });
  return presentarSolicitud(resultado, actor); // Responde con la solicitud ya confirmada en MongoDB.
}

export async function editarSolicitud(id, datos, actor) { // Permite modificar exclusivamente solicitudes propias pendientes.
  const validado = await validarFormulario(datos); // Aplica los mismos limites y referencias de la creacion.
  const resultado = await transaccion(async sesion => { // Protege la edicion frente a decisiones simultaneas del propietario.
    const solicitud = await consultarUno(Solicitud, { _id: texto(id, 'id') }, sesion); // Obtiene iniciativa y propietario original de la solicitud.
    exigir(solicitud, 404, 'NOT_FOUND', 'Solicitud no encontrada.'); // Informa recursos inexistentes de forma controlada.
    await bloquearIniciativa(solicitud.iniciativaId, sesion); // Ordena la edicion con aceptacion, rechazo y cancelacion.
    exigir(solicitud.solicitanteId === actor.id, 403, 'FORBIDDEN', 'Solo puede modificar sus propias solicitudes.'); // Evita editar solicitudes ajenas aunque se conozca su ID.
    exigir(solicitud.estado === 'pendiente', 409, 'CONFLICT', 'Solo puede modificar solicitudes pendientes.'); // Las decisiones terminales conservan su historial.
    Object.assign(solicitud, validado); // Mantiene solicitante, iniciativa, estado y fecha original.
    return solicitud.save({ session: sesion }); // Escribe todos los campos editables en la misma transaccion.
  });
  return presentarSolicitud(resultado, actor); // Devuelve el resultado sin modificar contratos del cliente.
}

export async function decidirSolicitud(id, datos, actor) { // Gestiona cancelacion, aceptacion y rechazo mediante transiciones explicitas.
  camposPermitidos(datos, ['estado', 'respuesta']); // No permite alterar otra informacion con la ruta de decisiones.
  const estado = opcion(datos.estado, 'estado', ['aceptada', 'rechazada', 'cancelada']); // Impide reabrir solicitudes mediante estados arbitrarios.
  const respuesta = texto(datos.respuesta ?? '', 'respuesta', 0, 2000); // Valida el comentario opcional del propietario.
  const resultado = await transaccion(async sesion => { // Aceptacion y alta del miembro se confirman o revierten juntas.
    const solicitud = await consultarUno(Solicitud, { _id: texto(id, 'id') }, sesion); // Recupera la solicitud desde su identificador estable.
    exigir(solicitud, 404, 'NOT_FOUND', 'Solicitud no encontrada.'); // Evita trabajar sobre solicitudes inexistentes.
    const iniciativa = await bloquearIniciativa(solicitud.iniciativaId, sesion); // Previene equipos duplicados y conversiones con miembros desactualizados.
    exigir(iniciativa, 404, 'NOT_FOUND', 'Iniciativa no encontrada.'); // Protege la referencia aun ante datos externos inconsistentes.
    exigir(estado === 'cancelada' ? solicitud.solicitanteId === actor.id : esPropietario(iniciativa, actor), 403, 'FORBIDDEN', 'No tiene permiso para esta decision.'); // Solo el solicitante cancela; solo el propietario acepta o rechaza.
    exigir(solicitud.estado === 'pendiente', 409, 'CONFLICT', 'La solicitud ya fue resuelta.'); // No permite transiciones desde estados terminales.
    if (estado === 'aceptada') { // El alta de integrantes se ejecuta exclusivamente como consecuencia de aceptar.
      exigir(!cerrada(iniciativa) && iniciativa.estado !== 'Borrador', 409, 'CONFLICT', 'La iniciativa ya no admite integrantes.'); // Revalida el estado al momento de aceptar.
      exigir(!iniciativa.equipo.some(miembro => miembro.usuarioId === solicitud.solicitanteId), 409, 'CONFLICT', 'El usuario ya pertenece al equipo.'); // Evita duplicados incluso con solicitudes historicas anteriores.
      exigir(iniciativa.equipo.length < iniciativa.participantesEstimados, 409, 'CONFLICT', 'La iniciativa no tiene espacios disponibles.'); // Respeta la capacidad incluyendo al propietario.
      exigir(await consultarUno(Usuario, { _id: solicitud.solicitanteId, activo: true }, sesion), 409, 'CONFLICT', 'La cuenta solicitante no esta activa.'); // Impide incorporar una cuenta desactivada.
      iniciativa.equipo.push({ usuarioId: solicitud.solicitanteId, rol: solicitud.rolSolicitado }); // Registra automaticamente rol y fecha de incorporacion.
      iniciativa.estado = 'En formación de equipo'; // Refleja que la iniciativa ya esta conformando su equipo.
      await iniciativa.save({ session: sesion }); // Guarda el miembro dentro de la misma transaccion que la decision.
    }
    solicitud.estado = estado; // Cambia el estado solo despues de comprobar identidad y reglas.
    solicitud.fechaDecision = new Date(); // Conserva cuando se produjo la transicion.
    if (estado !== 'cancelada') solicitud.respuesta = respuesta; // Evita que el solicitante atribuya comentarios al propietario.
    return solicitud.save({ session: sesion }); // Confirma decision y equipo como una operacion atomica.
  });
  return presentarSolicitud(resultado, actor); // Devuelve la decision persistida con el formato del contrato.
}

export async function consultarSolicitud(id, actor) { // Consulta individual reservada al solicitante y al propietario.
  const solicitud = await consultarUno(Solicitud, { _id: texto(id, 'id') }); // Recupera la solicitud por ID sin confiar en un solicitante del body.
  exigir(solicitud, 404, 'NOT_FOUND', 'Solicitud no encontrada.'); // Normaliza recursos que no existen.
  const iniciativa = await consultarUno(Iniciativa, { _id: solicitud.iniciativaId }); // Comprueba la propiedad actual de la iniciativa.
  exigir(solicitud.solicitanteId === actor.id || (iniciativa && esPropietario(iniciativa, actor)), 403, 'FORBIDDEN', 'No tiene acceso a esta solicitud.'); // Protege mensajes y disponibilidad frente a terceros.
  return presentarSolicitud(solicitud, actor); // Proyecta campos publicos e historicos autorizados.
}

export async function listarSolicitudes(query, actor) { // Lista propias o recibidas con filtros y paginacion en MongoDB.
  const { page, size } = paginacion(query, ['scope', 'status', 'initiativeId', 'skill', 'role', 'date']); // Limita parametros a los filtros documentados.
  const scope = opcion(query.scope ?? 'mine', 'scope', ['mine', 'received']); // El listado predeterminado corresponde al solicitante autenticado.
  const filtro = scope === 'mine' ? { solicitanteId: actor.id } : {}; // Nunca acepta la identidad de otro solicitante desde la URL.
  if (query.status !== undefined) filtro.estado = opcion(query.status, 'status', estadosSolicitud); // Combina el estado con los permisos del listado.
  if (query.initiativeId !== undefined) filtro.iniciativaId = texto(query.initiativeId, 'initiativeId'); // Restringe a una iniciativa sin descargar todas sus solicitudes.
  if (query.skill !== undefined) filtro.competencias = texto(query.skill, 'skill', 1, 100); // Filtra la competencia ofrecida usando valores simples.
  if (query.role !== undefined) filtro.rolSolicitado = texto(query.role, 'role', 1, 100); // Aplica el filtro de rol solicitado en el servidor.
  if (query.date !== undefined) { // Permite filtrar por un dia natural en UTC.
    const fecha = texto(query.date, 'date', 10, 10); // Exige la longitud del formato YYYY-MM-DD.
    exigir(/^\d{4}-\d{2}-\d{2}$/.test(fecha) && Number.isFinite(Date.parse(fecha)) && new Date(fecha).toISOString().slice(0, 10) === fecha, 400, 'VALIDATION_ERROR', 'Fecha invalida.'); // Rechaza dias inexistentes normalizados por JavaScript.
    filtro.fechaCreacion = { $gte: new Date(fecha), $lt: new Date(Date.parse(fecha) + 86400000) }; // Incluye todo el dia sin depender de la zona horaria del equipo.
  }
  const etapas = [{ $match: filtro }]; // Aplica primero filtros propios de solicitudes.
  if (scope === 'received') etapas.push({ $lookup: { from: Iniciativa.collection.name, localField: 'iniciativaId', foreignField: '_id', as: 'origen' } }, { $match: { 'origen.propietarioId': actor.id } }, { $unset: 'origen' }); // Restringe recibidas por propiedad con una union dentro de MongoDB.
  const pagina = await paginarAgregado(Solicitud, etapas, { fechaCreacion: -1, _id: 1 }, page, size); // Cuenta y limita despues de aplicar permisos, sin cargar IDs de todas las iniciativas.
  return { ...pagina, items: await Promise.all(pagina.items.map(solicitud => presentarSolicitud(solicitud, actor))) }; // Proyecta solo la pagina solicitada en el formato esperado por el cliente.
}
