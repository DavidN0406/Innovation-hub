import { Router } from 'express'; // Agrupa rutas de iniciativas separadas de las reglas de negocio.
import { exigirSesion } from '../middleware/sesion.js'; // Exige autenticacion para toda escritura sobre iniciativas.
import { listarIniciativas, consultarIniciativa, crearIniciativa, editarIniciativa, eliminarOArchivar } from '../servicios/iniciativas.js'; // Delega validaciones y persistencia al servicio de iniciativas.

export const rutasIniciativas = Router(); // Se monta bajo /api/initiatives.
rutasIniciativas.get('/', async (req, res) => res.json(await listarIniciativas(req.query, req.actor))); // Permite catalogo publico filtrado y vistas autenticadas por scope.
rutasIniciativas.get('/:id', async (req, res) => res.json(await consultarIniciativa(req.params.id, req.actor))); // Resuelve detalle segun identidad y visibilidad.
rutasIniciativas.post('/', exigirSesion, async (req, res) => res.status(201).json(await crearIniciativa(req.body, req.actor))); // Crea recursos con identidad y fechas del servidor.
rutasIniciativas.put('/:id', exigirSesion, async (req, res) => res.json(await editarIniciativa(req.params.id, req.body, req.actor))); // Conserva ID, propietario y fechas originales al editar.
rutasIniciativas.delete('/:id', exigirSesion, async (req, res) => { // Aplica eliminacion o archivado segun las relaciones persistidas.
  const resultado = await eliminarOArchivar(req.params.id, req.actor); // Decide la accion dentro de una transaccion protegida.
  if (resultado) return res.json(resultado); // Explica con 200 cuando se archivo y conservo el historial.
  res.status(204).end(); // Usa 204 sin cuerpo cuando se elimino una iniciativa sin relaciones.
});
rutasIniciativas.patch('/:id/archive', exigirSesion, async (req, res) => res.json(await eliminarOArchivar(req.params.id, req.actor, true))); // Permite archivar explicitamente desde el flujo actual del cliente.
