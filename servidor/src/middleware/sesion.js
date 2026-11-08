import { Usuario } from '../datos/modelos.js'; // Resuelve la identidad actual desde MongoDB en cada peticion protegida.
import { ErrorHttp } from './errores.js'; // Produce una respuesta 401 uniforme para sesiones invalidas.

export async function cargarActor(req, res, next) { // Adjunta una identidad verificada sin confiar en IDs del body o de la URL.
  req.actor = req.session?.usuarioId ? await Usuario.findOne({ _id: req.session.usuarioId, activo: true }) : null; // Revalida el estado activo aunque la cookie todavia exista.
  next(); // Permite consultas publicas y deja a cada ruta exigir autenticacion cuando corresponda.
}

export function exigirSesion(req, res, next) { // Protege rutas que solo pueden usar usuarios autenticados.
  if (!req.actor) return next(new ErrorHttp(401, 'UNAUTHENTICATED', 'Inicie sesion para continuar.')); // Rechaza cookies ausentes, expiradas o de cuentas inactivas.
  next(); // Entrega a los servicios una identidad obtenida exclusivamente de la sesion.
}
