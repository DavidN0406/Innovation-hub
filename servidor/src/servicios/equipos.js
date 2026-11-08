import { Iniciativa, Usuario } from '../datos/modelos.js'; // Consulta equipos embebidos y perfiles actuales sin duplicar nombres.
import { consultarUno, bloquearIniciativa, transaccion } from '../datos/repositorio.js'; // Comparte el bloqueo utilizado por conversion y aceptacion de solicitudes.
import { texto } from './validacion.js'; // Valida identificadores y parametros antes de consultar la base.
import { exigir } from '../middleware/errores.js'; // Devuelve permisos y conflictos de negocio con el mismo contrato.
import { puedeVerCompleta, esPropietario, exigirPropietario, resumenIniciativa } from './permisos.js'; // Reutiliza visibilidad y propiedad reales del servidor.

export async function consultarEquipo(id, actor) { // Expone integrantes exclusivamente cuando existe acceso completo a la iniciativa.
  const iniciativa = await consultarUno(Iniciativa, { _id: texto(id, 'id') }); // Recupera la iniciativa solicitada por la ruta.
  exigir(iniciativa, 404, 'NOT_FOUND', 'Iniciativa no encontrada.'); // Maneja identificadores inexistentes antes de verificar acceso.
  exigir(puedeVerCompleta(iniciativa, actor), 403, 'FORBIDDEN', 'No tiene acceso al equipo de esta iniciativa.'); // Impide obtener el equipo de una restringida con acceso solo al resumen.
  const perfiles = await Usuario.find({ _id: { $in: iniciativa.equipo.map(miembro => miembro.usuarioId) } }); // Consulta unicamente perfiles del equipo autorizado.
  const miembros = iniciativa.equipo.map(miembro => { // Construye la respuesta a partir de datos actuales de cada usuario.
    const perfil = perfiles.find(usuario => usuario.id === miembro.usuarioId); // Relaciona la membresia con su perfil vigente.
    return { usuarioId: miembro.usuarioId, nombre: perfil?.nombre ?? 'Usuario inactivo', carrera: perfil?.carrera ?? '', competencias: perfil?.competencias ?? [], rol: miembro.rol, fechaIncorporacion: miembro.fechaIncorporacion }; // Excluye correo, hash y toda informacion privada de autenticacion.
  });
  return { iniciativa: resumenIniciativa(iniciativa), miembros, puedeRetirar: esPropietario(iniciativa, actor) }; // Conserva el formato consumido por EquipoIniciativa.jsx.
}

export async function retirarMiembro(id, usuarioId, actor) { // Retira integrantes solo por decision del propietario autenticado.
  texto(usuarioId, 'usuarioId'); // Valida la identidad objetivo antes de iniciar la transaccion.
  await transaccion(async sesion => { // Evita retirar al ultimo miembro al mismo tiempo que se convierte la iniciativa.
    const iniciativa = await bloquearIniciativa(texto(id, 'id'), sesion); // Serializa la operacion con todas las escrituras relacionadas.
    exigirPropietario(iniciativa, actor); // Revalida propiedad dentro de la transaccion.
    exigir(usuarioId !== iniciativa.propietarioId, 409, 'CONFLICT', 'El propietario no puede retirarse del equipo.'); // Conserva el propietario automatico exigido por el dominio.
    exigir(iniciativa.equipo.some(miembro => miembro.usuarioId === usuarioId), 404, 'NOT_FOUND', 'Miembro no encontrado.'); // No confirma un retiro que no se realizo.
    iniciativa.equipo = iniciativa.equipo.filter(miembro => miembro.usuarioId !== usuarioId); // Quita solo la membresia activa elegida.
    iniciativa.retiros.push({ usuarioId }); // Conserva fecha de retiro y referencia para trazabilidad.
    await iniciativa.save({ session: sesion }); // Confirma equipo e historial en la misma escritura.
  });
}
