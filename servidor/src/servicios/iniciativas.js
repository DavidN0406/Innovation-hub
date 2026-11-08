import { Iniciativa, Solicitud, Proyecto, Categoria, Usuario } from '../datos/modelos.js'; // Reune los modelos necesarios para validar relaciones y conservar historial.
import { consultarUno, insertar, paginar, transaccion, bloquearIniciativa } from '../datos/repositorio.js'; // Centraliza consultas, paginacion y escrituras atomicas.
import { tipos, visibilidades, estadosIniciativa } from '../datos/catalogos.js'; // Usa valores controlados compartidos con los esquemas.
import { camposPermitidos, texto, lista, opcion, paginacion, filtroTexto } from './validacion.js'; // Revalida formularios y filtros enviados desde cualquier cliente.
import { validarCompetencias } from './usuarios.js'; // Comprueba competencias existentes antes de referenciarlas.
import { exigir } from '../middleware/errores.js'; // Genera errores HTTP consistentes sin filtrar detalles MongoDB.
import { puedeExplorar, puedeVerCompleta, esPropietario, esMiembro, cerrada, exigirPropietario, filtroVisible, resumenIniciativa } from './permisos.js'; // Comparte permisos con equipos y proyectos.

async function validarFormulario(datos) { // Construye una lista blanca de campos editables de una iniciativa.
  camposPermitidos(datos, ['titulo', 'tipo', 'resumen', 'descripcion', 'problema', 'beneficiarios', 'categoria', 'competencias', 'participantesEstimados', 'visibilidad', 'etiquetas']); // Evita modificar propietario, equipo, estado o fechas mediante el body.
  const resultado = {}; // Acumula exclusivamente valores que pasaron la validacion del servidor.
  for (const [campo, minimo, maximo] of [['titulo', 5, 80], ['resumen', 20, 200], ['descripcion', 30, 1000], ['problema', 15, 500], ['beneficiarios', 3, 150]]) resultado[campo] = texto(datos[campo], campo, minimo, maximo); // Conserva los limites actuales del formulario de iniciativas.
  resultado.tipo = opcion(datos.tipo, 'tipo', tipos); // Exige Idea, Necesidad o Reto.
  resultado.visibilidad = opcion(datos.visibilidad, 'visibilidad', visibilidades); // Valida exactamente un nivel del documento general.
  resultado.categoria = texto(datos.categoria, 'categoria', 1, 100); // Rechaza filtros u objetos enviados como categoria.
  exigir(await consultarUno(Categoria, { _id: resultado.categoria }), 400, 'VALIDATION_ERROR', 'Categoria invalida.', { categoria: 'Seleccione una categoria del catalogo.' }); // Mantiene una referencia valida al catalogo MongoDB.
  resultado.competencias = await validarCompetencias(datos.competencias, 1); // Verifica que cada competencia exista y no este repetida.
  resultado.etiquetas = lista(datos.etiquetas, 'etiquetas', { maximo: 5, longitud: 20 }); // Limita las etiquetas embebidas sin admitir objetos.
  exigir(Number.isInteger(datos.participantesEstimados) && datos.participantesEstimados >= 1 && datos.participantesEstimados <= 50, 400, 'VALIDATION_ERROR', 'Cantidad de integrantes invalida.', { participantesEstimados: 'Indique un entero entre 1 y 50.' }); // Define cupos incluyendo al propietario.
  resultado.participantesEstimados = datos.participantesEstimados; // Copia solamente el numero validado.
  return resultado; // Devuelve datos listos para crear o editar sin asignacion masiva.
}

export async function presentarIniciativa(iniciativa, actor) { // Adapta el documento persistido a la respuesta que necesita el cliente.
  exigir(iniciativa && puedeExplorar(iniciativa, actor), 404, 'NOT_FOUND', 'La iniciativa no existe o no esta disponible.'); // No revela iniciativas privadas mediante consultas directas.
  const accesoCompleto = puedeVerCompleta(iniciativa, actor); // Decide en el servidor si puede enviar los campos protegidos.
  const propia = esPropietario(iniciativa, actor); // Calcula propiedad a partir de la sesion real.
  const miembro = esMiembro(iniciativa, actor); // Evita ofrecer solicitudes a integrantes actuales.
  const otroMiembro = iniciativa.equipo.some(actual => actual.usuarioId !== iniciativa.propietarioId); // Verifica la condicion minima de conversion.
  const permisos = { puedeEditar: propia && iniciativa.estado !== 'Archivada', puedeArchivar: propia && iniciativa.estado !== 'Archivada', puedeSolicitar: Boolean(actor && !propia && !miembro && !cerrada(iniciativa) && iniciativa.estado !== 'Borrador'), puedeVerEquipo: accesoCompleto, puedeConvertir: propia && otroMiembro && !cerrada(iniciativa), faltaMiembroParaConvertir: propia && !otroMiembro && !cerrada(iniciativa) }; // Expone ayudas de interfaz sin sustituir la autorizacion de cada escritura.
  const resumen = resumenIniciativa(iniciativa); // Produce un resumen seguro aun para iniciativas restringidas.
  if (!accesoCompleto) return { ...resumen, accesoCompleto, permisos }; // Nunca incluye descripcion o problema para usuarios sin acceso completo.
  const usuarios = await Usuario.find({ _id: { $in: iniciativa.equipo.map(actual => actual.usuarioId) } }); // Resuelve nombres actuales de la pagina sin duplicarlos en el equipo.
  const equipo = iniciativa.equipo.map(actual => ({ usuarioId: actual.usuarioId, nombre: usuarios.find(usuario => usuario.id === actual.usuarioId)?.nombre ?? 'Usuario inactivo', rol: actual.rol, fechaIncorporacion: actual.fechaIncorporacion })); // Mantiene los campos esperados por las pantallas existentes.
  return { ...resumen, descripcion: iniciativa.descripcion, problema: iniciativa.problema, beneficiarios: iniciativa.beneficiarios, participantesEstimados: iniciativa.participantesEstimados, etiquetas: iniciativa.etiquetas, autor: equipo.find(actual => actual.usuarioId === iniciativa.propietarioId)?.nombre ?? '', equipo, integrantesActuales: equipo.length, espaciosDisponibles: Math.max(0, iniciativa.participantesEstimados - equipo.length), fechaPublicacion: iniciativa.fechaCreacion.toISOString().slice(0, 10), fechaCreacion: iniciativa.fechaCreacion, fechaModificacion: iniciativa.fechaModificacion, accesoCompleto, permisos }; // Entrega el detalle completo con IDs y fechas portables.
}

export async function listarIniciativas(query, actor) { // Resuelve el catalogo y las listas auxiliares de participacion en una misma ruta.
  const { page, size } = paginacion(query, ['q', 'type', 'category', 'skill', 'status', 'owner', 'visibility', 'spaces', 'scope', 'sort']); // Admite solo filtros documentados con paginacion uniforme.
  if (query.scope !== undefined) { // Las vistas auxiliares usan un scope explicito del contrato de Gustavo.
    opcion(query.scope, 'scope', ['accessible', 'owned']); // Rechaza ambitos inventados o malformados.
    exigir(actor, 401, 'UNAUTHENTICATED', 'Inicie sesion para continuar.'); // Protege las listas asociadas a un usuario.
  }
  const condiciones = [query.scope === 'owned' ? { propietarioId: actor.id } : filtroVisible(actor)]; // Aplica permisos dentro de MongoDB antes del limite y del conteo.
  for (const [parametro, campo, valores] of [['type', 'tipo', tipos], ['status', 'estado', estadosIniciativa], ['visibility', 'visibilidad', visibilidades]]) if (query[parametro] !== undefined) condiciones.push({ [campo]: opcion(query[parametro], parametro, valores) }); // Combina filtros enumerados con los permisos de acceso.
  for (const [parametro, campo] of [['category', 'categoria'], ['skill', 'competencias'], ['owner', 'propietarioId']]) if (query[parametro] !== undefined) condiciones.push({ [campo]: texto(query[parametro], parametro, 1, 100) }); // Usa valores escalares validados, nunca operadores recibidos del cliente.
  const busqueda = filtroTexto(query.q, 'q'); // Convierte el texto a una expresion literal escapada.
  if (busqueda) condiciones.push({ $or: [{ titulo: busqueda }, { resumen: busqueda }, { etiquetas: busqueda }] }); // Busca tambien sobre etiquetas como solicita el documento general.
  if (query.spaces !== undefined) { // Filtra disponibilidad de cupos antes de paginar.
    opcion(query.spaces, 'spaces', ['true', 'false']); // Exige un booleano textual explicito en la URL.
    condiciones.push({ $expr: { [query.spaces === 'true' ? '$gt' : '$lte']: ['$participantesEstimados', { $size: '$equipo' }] } }); // Compara cantidad esperada con integrantes actuales directamente en MongoDB.
  }
  const orden = opcion(query.sort ?? 'id-asc', 'sort', ['id-asc', 'titulo-asc', 'titulo-desc', 'fecha-asc', 'fecha-desc']); // Restringe el ordenamiento a criterios estables del contrato.
  const campo = orden.startsWith('titulo') ? 'titulo' : orden.startsWith('fecha') ? 'fechaCreacion' : '_id'; // Traduce el codigo publico al campo de persistencia.
  const pagina = await paginar(Iniciativa, { $and: condiciones }, { [campo]: orden.endsWith('desc') ? -1 : 1, _id: 1 }, page, size); // Consulta solo la pagina autorizada con desempate por ID.
  return { ...pagina, items: await Promise.all(pagina.items.map(iniciativa => presentarIniciativa(iniciativa, actor))) }; // Retira campos protegidos antes de responder.
}

export async function consultarIniciativa(id, actor) { // Consulta detalle con los mismos permisos que el catalogo.
  return presentarIniciativa(await consultarUno(Iniciativa, { _id: texto(id, 'id') }), actor); // Responde 404 para inexistentes y privadas no autorizadas.
}

export async function crearIniciativa(datos, actor) { // Registra una iniciativa con propietario y equipo calculados en el servidor.
  const validado = await validarFormulario(datos); // Valida campos y referencias antes de escribir.
  const iniciativa = await insertar(Iniciativa, { ...validado, propietarioId: actor.id, equipo: [{ usuarioId: actor.id, rol: 'Propietario' }] }); // Incorpora automaticamente al propietario sin solicitud.
  return presentarIniciativa(iniciativa, actor); // Devuelve el recurso creado y sus permisos derivados.
}

export async function editarIniciativa(id, datos, actor) { // Modifica el recurso exclusivamente para su propietario autenticado.
  const validado = await validarFormulario(datos); // Evita iniciar una transaccion con un formulario invalido.
  const resultado = await transaccion(async sesion => { // Serializa la edicion respecto a aceptaciones y conversiones concurrentes.
    const iniciativa = await bloquearIniciativa(texto(id, 'id'), sesion); // Bloquea el documento compartido por todas las operaciones relacionadas.
    exigirPropietario(iniciativa, actor); // Revalida propiedad dentro de la transaccion.
    exigir(iniciativa.estado !== 'Archivada', 409, 'CONFLICT', 'Una iniciativa archivada no admite modificacion.'); // Aplica la regla de edicion del documento general.
    exigir(validado.participantesEstimados >= iniciativa.equipo.length, 409, 'CONFLICT', 'No puede reducir los cupos por debajo del equipo actual.'); // Evita cupos negativos o miembros fuera de capacidad.
    Object.assign(iniciativa, validado); // Conserva identificador, propietario, fecha original y equipo.
    return iniciativa.save({ session: sesion }); // Persiste los cambios en la misma unidad atomica.
  });
  return presentarIniciativa(resultado, actor); // Proyecta la version confirmada de la iniciativa.
}

export async function eliminarOArchivar(id, actor, forzarArchivo = false) { // Decide la accion real segun relaciones, sin depender de lo que indique React.
  return transaccion(async sesion => { // Evita que aparezca una relacion entre la comprobacion y la eliminacion.
    const iniciativa = await bloquearIniciativa(texto(id, 'id'), sesion); // Usa el mismo bloqueo que solicitudes, retiros y conversiones.
    exigirPropietario(iniciativa, actor); // Solo el autor puede ejecutar cualquiera de las dos acciones.
    exigir(iniciativa.estado !== 'Archivada', 409, 'CONFLICT', 'La iniciativa ya esta archivada.'); // Evita confirmar dos veces la misma accion.
    const solicitudes = await Solicitud.exists({ iniciativaId: id }).session(sesion); // Incluye pendientes, aceptadas, rechazadas y canceladas como informacion historica.
    const proyecto = await Proyecto.exists({ iniciativaId: id }).session(sesion); // Conserva siempre la referencia de un proyecto originado aqui.
    if (forzarArchivo || solicitudes || proyecto || iniciativa.equipo.length > 1 || iniciativa.retiros.length) { // Excluye al propietario automatico como relacion que impediria cualquier eliminacion inicial.
      iniciativa.estado = 'Archivada'; // Mantiene documentos y referencias cuando existe informacion relacionada.
      await iniciativa.save({ session: sesion }); // Confirma el archivado junto con el bloqueo de la iniciativa.
      return { accion: 'archivada', id }; // Permite explicar a la interfaz que se conservo el historial.
    }
    await Iniciativa.deleteOne({ _id: id }, { session: sesion }); // Elimina fisicamente solo iniciativas sin historial ni otros miembros.
    return null; // La ruta transforma este resultado en 204 sin contenido.
  });
}
