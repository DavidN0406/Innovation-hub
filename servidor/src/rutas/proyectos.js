import { Router } from 'express'; // Mantiene el enrutamiento de proyectos separado de su conversion y persistencia.
import { exigirSesion } from '../middleware/sesion.js'; // Requiere una cuenta activa en todas las rutas del contrato de proyectos.
import { convertirIniciativa, listarProyectos, consultarProyecto } from '../servicios/proyectos.js'; // Centraliza autorizacion y proyeccion en los servicios del dominio.

export const rutasProyectos = Router(); // Se monta bajo /api para conservar las rutas acordadas.
rutasProyectos.post('/initiatives/:id/projects', exigirSesion, async (req, res) => res.status(201).json(await convertirIniciativa(req.params.id, req.body, req.actor))); // Convierte de manera atomica y conserva la iniciativa original.
rutasProyectos.get('/projects', exigirSesion, async (req, res) => res.json(await listarProyectos(req.query, req.actor))); // Lista solamente proyectos visibles con paginacion previa a la respuesta.
rutasProyectos.get('/projects/:id', exigirSesion, async (req, res) => res.json(await consultarProyecto(req.params.id, req.actor))); // Consulta el detalle desde el identificador y verifica acceso completo al origen.
