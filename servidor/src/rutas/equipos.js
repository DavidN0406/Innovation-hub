import { Router } from 'express'; // Agrupa consultas y retiros del equipo sin duplicar reglas en las rutas.
import { exigirSesion } from '../middleware/sesion.js'; // Obtiene la identidad real del actor para cada operacion.
import { consultarEquipo, retirarMiembro } from '../servicios/equipos.js'; // Delega permisos y persistencia al servicio de equipos.

export const rutasEquipos = Router(); // Se monta bajo /api para conservar las rutas existentes del cliente.
rutasEquipos.get('/initiatives/:id/team', exigirSesion, async (req, res) => res.json(await consultarEquipo(req.params.id, req.actor))); // Devuelve integrantes solo cuando existe acceso completo.
rutasEquipos.delete('/initiatives/:id/team/:usuarioId', exigirSesion, async (req, res) => { // Retira un integrante cuando lo solicita el propietario.
  await retirarMiembro(req.params.id, req.params.usuarioId, req.actor); // Verifica permisos y registra el retiro antes de responder.
  res.status(204).end(); // Confirma la operacion sin enviar un cuerpo que el cliente no espera.
});
