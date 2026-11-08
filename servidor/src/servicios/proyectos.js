import { Proyecto, Iniciativa } from '../datos/modelos.js'; // Relaciona cada proyecto con su iniciativa de origen persistida.
import { consultarUno, insertar, bloquearIniciativa, transaccion, paginarAgregado } from '../datos/repositorio.js'; // Comparte transacciones y paginacion autorizada con los demas servicios.
import { texto, lista, opcion, camposPermitidos, paginacion } from './validacion.js'; // Valida los datos antes de persistir la conversion.
import { estadosProyecto } from '../datos/catalogos.js'; // Reutiliza estados estables que cubren el documento general.
import { exigir } from '../middleware/errores.js'; // Emite errores HTTP controlados para permisos y conflictos.
import { cerrada, exigirPropietario, puedeVerCompleta, filtroVisible, resumenIniciativa } from './permisos.js'; // Conserva las reglas de acceso de la iniciativa de origen.

function fechaCalendario(valor, campo) { // Valida fechas reales sin convertirlas en instantes dependientes de una zona horaria.
  const fecha = texto(valor, campo, 10, 10); // Exige la longitud del formato de calendario.
  exigir(/^\d{4}-\d{2}-\d{2}$/.test(fecha) && Number.isFinite(Date.parse(fecha)) && new Date(fecha).toISOString().slice(0, 10) === fecha, 400, 'VALIDATION_ERROR', 'Revise los campos indicados.', { [campo]: 'Use una fecha real YYYY-MM-DD.' }); // Rechaza, por ejemplo, el 30 de febrero.
  return fecha; // Guarda la misma fecha que eligio el usuario.
}

function validarRepositorio(valor) { // Acepta un repositorio opcional sin almacenar claves ni datos de consultas.
  if (valor == null || valor === '') return null; // Representa de forma uniforme la ausencia de repositorio.
  const direccion = texto(valor, 'repositorio', 1, 300); // Evita cadenas excesivas u objetos recibidos por el body.
  exigir(/^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/?$/.test(direccion), 400, 'VALIDATION_ERROR', 'Revise los campos indicados.', { repositorio: 'Use https://github.com/propietario/repositorio sin credenciales, consulta ni fragmento.' }); // Limita el valor al formato consumido desde React por la API publica de GitHub.
  return direccion.replace(/\/$/, ''); // Evita dos representaciones del mismo repositorio con barra final.
}

function validarFormulario(datos) { // Selecciona exclusivamente campos editables del formulario de conversion.
  camposPermitidos(datos, ['nombre', 'descripcion', 'objetivo', 'fechaInicio', 'estado', 'repositorio', 'tecnologias', 'fechaFinEstimada']); // Protege iniciativa, propietario, miembros, ID y fechas generadas por el servidor.
  const fechaInicio = fechaCalendario(datos.fechaInicio, 'fechaInicio'); // Comprueba la fecha obligatoria antes de crear el proyecto.
  const fechaFinEstimada = datos.fechaFinEstimada == null || datos.fechaFinEstimada === '' ? null : fechaCalendario(datos.fechaFinEstimada, 'fechaFinEstimada'); // Permite omitir una fecha de cierre aun desconocida.
  exigir(!fechaFinEstimada || fechaFinEstimada >= fechaInicio, 400, 'VALIDATION_ERROR', 'La fecha final no puede ser anterior al inicio.', { fechaFinEstimada: 'Debe ser igual o posterior al inicio.' }); // Revalida la relacion entre fechas tambien en el servidor.
  return { nombre: texto(datos.nombre, 'nombre', 1, 150), descripcion: texto(datos.descripcion, 'descripcion', 1, 4000), objetivo: texto(datos.objetivo, 'objetivo', 1, 2000), fechaInicio, estado: opcion(datos.estado ?? 'planificado', 'estado', estadosProyecto), repositorio: validarRepositorio(datos.repositorio), tecnologias: lista(datos.tecnologias ?? [], 'tecnologias'), fechaFinEstimada }; // Conserva Planificacion como estado inicial predeterminado y admite el estado elegido por el formulario del avance 2.
}

export async function presentarProyecto(proyecto, actor) { // Proyecta proyectos completos exclusivamente para usuarios con acceso al origen.
  exigir(proyecto, 404, 'NOT_FOUND', 'Proyecto no encontrado.'); // Controla IDs inexistentes antes de consultar referencias.
  const iniciativa = await consultarUno(Iniciativa, { _id: proyecto.iniciativaId }); // Resuelve la referencia original sin copiar datos que puedan quedar desactualizados.
  exigir(iniciativa && puedeVerCompleta(iniciativa, actor), 404, 'NOT_FOUND', 'El proyecto no existe o no esta disponible.'); // Evita usar proyectos como atajo para leer iniciativas restringidas o privadas.
  return { id: proyecto.id, iniciativaId: proyecto.iniciativaId, iniciativa: resumenIniciativa(iniciativa), nombre: proyecto.nombre, descripcion: proyecto.descripcion, objetivo: proyecto.objetivo, fechaInicio: proyecto.fechaInicio, estado: proyecto.estado, repositorio: proyecto.repositorio, tecnologias: proyecto.tecnologias, fechaFinEstimada: proyecto.fechaFinEstimada, fechaCreacion: proyecto.fechaCreacion }; // Mantiene todos los campos esperados por DetalleProyecto.jsx y sus validadores.
}

export async function convertirIniciativa(id, datos, actor) { // Crea un proyecto y cierra la iniciativa en una sola operacion atomica.
  const validado = validarFormulario(datos); // Valida datos y URL antes de abrir la transaccion.
  const resultado = await transaccion(async sesion => { // Garantiza que proyecto e iniciativa queden consistentes si falla cualquier escritura.
    const iniciativa = await bloquearIniciativa(texto(id, 'id'), sesion); // Serializa conversion, aceptacion, archivo y retiro de miembros.
    exigirPropietario(iniciativa, actor); // Solo el propietario autenticado puede convertir.
    exigir(!cerrada(iniciativa) && iniciativa.estado !== 'Borrador', 409, 'CONFLICT', 'La iniciativa no puede convertirse en su estado actual.'); // Impide duplicados y conversion de archivos o borradores.
    exigir(iniciativa.equipo.some(miembro => miembro.usuarioId !== iniciativa.propietarioId), 409, 'CONFLICT', 'Se requiere otro miembro ademas del propietario.'); // Aplica la condicion de conversion con los datos actuales de MongoDB.
    exigir(!await consultarUno(Proyecto, { iniciativaId: id }, sesion), 409, 'CONFLICT', 'La iniciativa ya tiene un proyecto.'); // Complementa el indice unico con una explicacion de negocio.
    const proyecto = await insertar(Proyecto, { ...validado, iniciativaId: id }, sesion); // Conserva el vinculo permanente con la iniciativa original.
    iniciativa.estado = 'Convertida'; // Usa el codigo que el cliente actual reconoce como iniciativa convertida en proyecto.
    await iniciativa.save({ session: sesion }); // Mantiene la iniciativa original y confirma su cambio junto al nuevo proyecto.
    return proyecto; // Entrega el proyecto solo si la transaccion finaliza correctamente.
  });
  return presentarProyecto(resultado, actor); // Devuelve el recurso creado con iniciativa y permisos ya verificados.
}

export async function listarProyectos(query, actor) { // Lista proyectos autorizados sin descargar todos los documentos.
  const { page, size } = paginacion(query, []); // Este avance solo necesita listado y detalle; otros filtros quedan fuera del contrato actual.
  const permisos = filtroVisible(actor, true); // Recupera la misma politica de acceso completo aplicada al detalle.
  const prefijar = valor => { // Adapta un filtro de iniciativas al alias utilizado en la union de MongoDB.
    if (Array.isArray(valor)) return valor.map(prefijar); // Recorre ramas logicas como $or sin cambiar su significado.
    if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([clave, contenido]) => [clave.startsWith('$') ? clave : `origen.${clave}`, clave.startsWith('$') ? prefijar(contenido) : contenido])); // Prefija campos y conserva operadores internos de comparacion.
    return valor; // Mantiene escalares que forman parte de condiciones de acceso.
  };
  const etapas = [{ $lookup: { from: Iniciativa.collection.name, localField: 'iniciativaId', foreignField: '_id', as: 'origen' } }, { $unwind: '$origen' }, { $match: prefijar(permisos) }, { $unset: 'origen' }]; // Filtra por la iniciativa relacionada antes de contar y paginar proyectos.
  const pagina = await paginarAgregado(Proyecto, etapas, { _id: 1 }, page, size); // Devuelve solo la pagina visible al usuario autenticado.
  return { ...pagina, items: await Promise.all(pagina.items.map(proyecto => presentarProyecto(proyecto, actor))) }; // Proyecta respuestas consistentes con la consulta individual.
}

export async function consultarProyecto(id, actor) { // Consulta por identificador y verifica la visibilidad de su iniciativa.
  return presentarProyecto(await consultarUno(Proyecto, { _id: texto(id, 'id') }), actor); // Un recurso ajeno oculto produce el mismo 404 que uno inexistente.
}
