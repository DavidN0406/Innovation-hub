import { exigir } from '../middleware/errores.js'; // Comparte las comprobaciones de acceso entre iniciativas, equipos y proyectos.

export const esPropietario = (iniciativa, actor) => Boolean(actor && iniciativa.propietarioId === actor.id); // Compara la propiedad con la identidad verificada de la sesion.
export const esMiembro = (iniciativa, actor) => Boolean(actor && iniciativa.equipo.some(miembro => miembro.usuarioId === actor.id)); // Considera exclusivamente integrantes activos del equipo embebido.
export const cerrada = iniciativa => ['Archivada', 'Convertida'].includes(iniciativa.estado); // Impide nuevas solicitudes y conversiones sobre iniciativas cerradas.

export function puedeExplorar(iniciativa, actor) { // Decide si una iniciativa puede aparecer o consultarse al menos como resumen.
  if (esPropietario(iniciativa, actor)) return true; // El propietario conserva acceso a borradores y archivos propios.
  if (iniciativa.estado === 'Borrador') return false; // Los borradores nunca se publican para otras personas.
  if (iniciativa.estado === 'Archivada') return esMiembro(iniciativa, actor); // Mantiene el historial accesible solo para su equipo.
  if (iniciativa.visibilidad === 'publica') return true; // Los visitantes pueden consultar informacion publica completa.
  if (!actor) return false; // Institucionales y restringidas requieren autenticacion para explorarse.
  return iniciativa.visibilidad !== 'privada' || esMiembro(iniciativa, actor); // Las privadas se ocultan incluso del catalogo de otros usuarios autenticados.
}

export function puedeVerCompleta(iniciativa, actor) { // Protege descripcion, problema, equipo y proyectos de iniciativas restringidas.
  return puedeExplorar(iniciativa, actor) && (['publica', 'institucional'].includes(iniciativa.visibilidad) || esMiembro(iniciativa, actor) || esPropietario(iniciativa, actor)); // Solo miembros y propietario reciben detalles de restringidas y privadas.
}

export function exigirPropietario(iniciativa, actor) { // Aplica el mismo control antes de toda escritura exclusiva del autor.
  exigir(iniciativa, 404, 'NOT_FOUND', 'Iniciativa no encontrada.'); // Controla un identificador inexistente antes de evaluar sus campos.
  exigir(esPropietario(iniciativa, actor), 403, 'FORBIDDEN', 'Solo el propietario puede realizar esta operacion.'); // Rechaza identidad ajena aunque el cliente muestre el boton.
}

export function filtroVisible(actor, completa = false) { // Construye permisos que MongoDB aplica antes de paginar el catalogo.
  const abiertas = { estado: { $nin: ['Borrador', 'Archivada'] } }; // Excluye los estados que no pertenecen al catalogo general.
  const publico = { ...abiertas, visibilidad: 'publica' }; // Permite a visitantes consultar exclusivamente iniciativas publicas.
  if (!actor) return publico; // No inventa permisos cuando no hay una sesion valida.
  return { $or: [{ propietarioId: actor.id }, { 'equipo.usuarioId': actor.id, estado: { $ne: 'Borrador' } }, publico, { ...abiertas, visibilidad: { $in: completa ? ['institucional'] : ['institucional', 'restringida'] } }] }; // Une propiedad, membresia y visibilidad institucional sin filtrar en React.
}

export function resumenIniciativa(iniciativa) { // Define el formato minimo compartido por solicitudes, equipos y proyectos.
  return { id: iniciativa.id, titulo: iniciativa.titulo, tipo: iniciativa.tipo, resumen: iniciativa.resumen, categoria: iniciativa.categoria, competencias: iniciativa.competencias, estado: iniciativa.estado, propietarioId: iniciativa.propietarioId, visibilidad: iniciativa.visibilidad }; // Omite deliberadamente descripcion, problema y datos privados del equipo.
}
