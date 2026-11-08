import { Usuario, Competencia } from '../datos/modelos.js'; // Accede a perfiles y al catalogo de competencias persistidos.
import { consultarUno, paginar } from '../datos/repositorio.js'; // Reutiliza las operaciones de consulta de la capa de datos.
import { exigir } from '../middleware/errores.js'; // Expresa permisos y validaciones mediante errores HTTP controlados.
import { camposPermitidos, texto, lista, paginacion, filtroTexto } from './validacion.js'; // Valida cuerpos y filtros antes de consultar MongoDB.

export function perfilPublico(usuario, propio = false) { // Selecciona explicitamente los campos que puede recibir React.
  const perfil = { id: usuario.id, nombre: usuario.nombre, primerApellido: usuario.primerApellido, segundoApellido: usuario.segundoApellido, tipoMiembro: usuario.tipoMiembro, rol: usuario.tipoMiembro, carrera: usuario.carrera, descripcion: usuario.descripcion, disponible: usuario.disponible, competencias: usuario.competencias, intereses: usuario.intereses, portafolio: usuario.portafolio, fechaModificacion: usuario.fechaModificacion }; // Evita serializar directamente documentos que contengan informacion de seguridad.
  if (propio) perfil.correo = usuario.correo; // Entrega el correo solo al titular de la sesion o de su perfil.
  return perfil; // Nunca incluye hash, contrasena, secreto ni datos de la sesion.
}

export async function validarCompetencias(valores, minimo = 0) { // Comprueba relaciones reales contra el catalogo MongoDB.
  const resultado = lista(valores, 'competencias', { minimo }); // Rechaza duplicados y valores que no sean cadenas.
  const existentes = await Competencia.countDocuments({ _id: { $in: resultado } }); // Cuenta las competencias declaradas que existen realmente.
  exigir(existentes === resultado.length, 400, 'VALIDATION_ERROR', 'Revise los campos indicados.', { competencias: 'Seleccione competencias del catalogo.' }); // Impide guardar referencias a competencias inexistentes.
  return resultado; // Devuelve nombres controlados que tambien funcionan como IDs del catalogo.
}

export async function consultarPerfil(id, actor) { // Consulta un perfil sin permitir acceso a cuentas inactivas.
  const usuario = await consultarUno(Usuario, { _id: texto(id, 'id'), activo: true }); // Restringe la lectura al identificador validado.
  exigir(usuario, 404, 'NOT_FOUND', 'Usuario no encontrado.'); // Responde sin revelar datos privados de autenticacion.
  return perfilPublico(usuario, usuario.id === actor.id); // Incluye el correo exclusivamente en la consulta propia.
}

export async function actualizarPerfil(id, datos, actor) { // Actualiza solamente campos editables del usuario autenticado.
  exigir(id === actor.id, 403, 'FORBIDDEN', 'Solo puede modificar su propio perfil.'); // No confia en el identificador recibido desde React.
  camposPermitidos(datos, ['nombre', 'primerApellido', 'segundoApellido', 'carrera', 'descripcion', 'disponible', 'competencias', 'intereses', 'portafolio']); // Protege correo, rol, identificador y estado de cuenta.
  const usuario = await consultarUno(Usuario, { _id: id, activo: true }); // Recupera la version vigente del perfil.
  exigir(usuario, 404, 'NOT_FOUND', 'Usuario no encontrado.'); // Controla cuentas eliminadas o desactivadas durante la peticion.
  const cambios = { nombre: texto(datos.nombre, 'nombre', 1, 100), carrera: texto(datos.carrera, 'carrera', 1, 150), competencias: await validarCompetencias(datos.competencias), intereses: lista(datos.intereses, 'intereses') }; // Revalida los campos principales y sus relaciones.
  exigir(typeof datos.disponible === 'boolean', 400, 'VALIDATION_ERROR', 'Revise su disponibilidad.', { disponible: 'Use true o false.' }); // No convierte cadenas ambiguas a booleanos.
  cambios.disponible = datos.disponible; // Conserva el valor comprobado sin conversiones implicitas.
  for (const campo of ['primerApellido', 'segundoApellido', 'descripcion', 'portafolio']) { // Permite ampliar el perfil sin obligar al cliente anterior a reenviar esos campos.
    if (datos[campo] !== undefined) cambios[campo] = texto(datos[campo], campo, campo === 'primerApellido' ? 1 : 0, campo === 'descripcion' ? 1000 : 300); // Aplica obligatoriedad y longitud segun el campo.
  }
  if (cambios.portafolio) exigir(cambios.portafolio.startsWith('https://') && URL.canParse(cambios.portafolio), 400, 'VALIDATION_ERROR', 'Portafolio invalido.', { portafolio: 'Use una URL HTTPS.' }); // Evita guardar enlaces de protocolos ejecutables.
  Object.assign(usuario, cambios); // Asigna exclusivamente la lista blanca validada por el servidor.
  await usuario.save(); // Persiste el perfil y actualiza su fecha de modificacion.
  return perfilPublico(usuario, true); // Devuelve el perfil actualizado sin hashes ni contrasenas.
}

export async function buscarUsuarios(query) { // Ejecuta busqueda, filtros combinados, orden y paginacion en MongoDB.
  const { page, size } = paginacion(query, ['q', 'skill', 'career', 'available', 'sort']); // Rechaza parametros ajenos al contrato.
  const filtro = { activo: true }; // Evita ofrecer cuentas inactivas como colaboradores.
  const nombre = filtroTexto(query.q, 'q'); // Prepara una busqueda literal por nombre.
  const carrera = filtroTexto(query.career, 'career', 150); // Prepara el filtro textual por carrera.
  if (nombre) filtro.nombre = nombre; // Combina nombre con el resto de criterios mediante AND.
  if (carrera) filtro.carrera = carrera; // Reduce resultados por area sin descargar perfiles innecesarios.
  if (query.skill !== undefined) filtro.competencias = texto(query.skill, 'skill', 1, 100); // Acepta una competencia simple sin operadores MongoDB.
  if (query.available !== undefined) { // Distingue ausencia del filtro de una disponibilidad negativa.
    exigir(['true', 'false'].includes(query.available), 400, 'VALIDATION_ERROR', 'Disponibilidad invalida.'); // Comprueba el formato booleano de la URL.
    filtro.disponible = query.available === 'true'; // Convierte el filtro comprobado al tipo del esquema.
  }
  const orden = query.sort ?? 'nombre-asc'; // Ordena por nombre ascendente cuando no se indica otro criterio.
  exigir(['nombre-asc', 'nombre-desc'].includes(orden), 400, 'VALIDATION_ERROR', 'Orden invalido.'); // Evita interpretar campos arbitrarios como ordenamiento.
  const pagina = await paginar(Usuario, filtro, { nombre: orden === 'nombre-desc' ? -1 : 1, _id: 1 }, page, size); // Utiliza el ID como desempate estable entre paginas.
  return { ...pagina, items: pagina.items.map(usuario => perfilPublico(usuario)) }; // Entrega perfiles publicos y metadatos uniformes.
}
