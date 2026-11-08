import { Router } from 'express'; // Define endpoints de perfiles sin mezclar su logica con el transporte.
import { exigirSesion } from '../middleware/sesion.js'; // Protege consultas y ediciones del directorio de usuarios.
import { buscarUsuarios, consultarPerfil, actualizarPerfil } from '../servicios/usuarios.js'; // Delega reglas y filtros al servicio correspondiente.

export const rutasUsuarios = Router(); // Agrupa las rutas que se montan bajo /api/users.
rutasUsuarios.use(exigirSesion); // Todas las operaciones de perfiles requieren una cuenta activa autenticada.
rutasUsuarios.get('/', async (req, res) => res.json(await buscarUsuarios(req.query))); // Entrega solo una pagina filtrada desde MongoDB.
rutasUsuarios.get('/:id', async (req, res) => res.json(await consultarPerfil(req.params.id, req.actor))); // Consulta un perfil seguro por identificador.
rutasUsuarios.put('/:id', async (req, res) => res.json(await actualizarPerfil(req.params.id, req.body, req.actor))); // Verifica propiedad antes de modificar datos editables.
