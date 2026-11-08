import { Router } from 'express'; // Separa las rutas HTTP de solicitudes de sus reglas de negocio.
import { exigirSesion } from '../middleware/sesion.js'; // Protege mensajes y decisiones con sesiones reales.
import { crearSolicitud, editarSolicitud, decidirSolicitud, consultarSolicitud, listarSolicitudes } from '../servicios/solicitudes.js'; // Reutiliza el servicio de solicitudes en todas las operaciones.

export const rutasSolicitudes = Router(); // Se monta bajo /api para conservar las rutas acordadas con Gustavo.
rutasSolicitudes.get('/requests', exigirSesion, async (req, res) => res.json(await listarSolicitudes(req.query, req.actor))); // Lista propias o recibidas con filtros y paginacion del servidor.
rutasSolicitudes.get('/requests/:id', exigirSesion, async (req, res) => res.json(await consultarSolicitud(req.params.id, req.actor))); // Consulta mensajes solo como solicitante o propietario.
rutasSolicitudes.post('/initiatives/:id/requests', exigirSesion, async (req, res) => res.status(201).json(await crearSolicitud(req.params.id, req.body, req.actor))); // Crea una solicitud propia pendiente.
rutasSolicitudes.put('/requests/:id', exigirSesion, async (req, res) => res.json(await editarSolicitud(req.params.id, req.body, req.actor))); // Edita exclusivamente solicitudes propias que siguen pendientes.
rutasSolicitudes.patch('/requests/:id/status', exigirSesion, async (req, res) => res.json(await decidirSolicitud(req.params.id, req.body, req.actor))); // Cancela, acepta o rechaza con autorizacion y transaccion.
