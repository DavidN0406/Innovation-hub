import { Router } from 'express'; // Separa el enrutamiento HTTP de la logica de cuentas y contrasenas.
import { rateLimit } from 'express-rate-limit'; // Limita intentos de registro e inicio de sesion por direccion.
import { registrar, autenticar, establecerSesion } from '../servicios/autenticacion.js'; // Delega las reglas de autenticacion al servicio de dominio.
import { perfilPublico } from '../servicios/usuarios.js'; // Genera respuestas seguras para la consulta de sesion.
import { exigirSesion } from '../middleware/sesion.js'; // Exige identidad valida donde corresponde.

export const rutasAutenticacion = Router(); // Agrupa endpoints que se montan bajo /api/auth.
const limite = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { code: 'RATE_LIMIT', message: 'Demasiados intentos. Intente mas tarde.', fields: {} } } }); // Acota intentos y conserva errores JSON uniformes.
rutasAutenticacion.post('/register', limite, async (req, res) => res.status(201).json(await establecerSesion(req, await registrar(req.body)))); // Registra y autentica la cuenta sin devolver el documento privado.
rutasAutenticacion.post('/login', limite, async (req, res) => res.json(await establecerSesion(req, await autenticar(req.body)))); // Inicia una sesion nueva despues de verificar el hash.
rutasAutenticacion.get('/me', exigirSesion, (req, res) => res.json(perfilPublico(req.actor, true))); // Recupera el usuario vigente al recargar la aplicacion.
rutasAutenticacion.post('/logout', exigirSesion, async (req, res) => { // Cierra la sesion en la base para invalidar tambien una cookie copiada.
  await new Promise((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve())); // Espera que MongoDB elimine la sesion antes de informar exito.
  res.clearCookie('innovation.sid', { path: '/', httpOnly: true, sameSite: 'lax', secure: req.app.locals.configuracion.produccion }); // Quita del navegador la cookie usando los mismos atributos de creacion.
  res.status(204).end(); // Devuelve exito sin cuerpo, conforme al contrato.
});
