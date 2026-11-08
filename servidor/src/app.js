import express from 'express'; // Proporciona el servidor HTTP y el enrutamiento de la API.
import cors from 'cors'; // Agrega las cabeceras necesarias para el cliente React en otro puerto.
import { ErrorHttp, manejarError } from './middleware/errores.js'; // Reutiliza el formato uniforme de errores.

export function crearApp(configuracion) { // Construye la aplicacion sin abrir puertos para facilitar pruebas aisladas.
  const app = express(); // Crea una instancia independiente de Express.
  app.disable('x-powered-by'); // Evita publicar la tecnologia del servidor en las respuestas.
  app.use((req, res, next) => { // Verifica el origen antes de procesar peticiones con credenciales.
    if (req.headers.origin && req.headers.origin !== configuracion.origen) return next(new ErrorHttp(403, 'ORIGIN_FORBIDDEN', 'Origen no autorizado.')); // Rechaza navegadores de origen distinto al cliente configurado.
    next(); // Permite herramientas locales sin Origin y el cliente autorizado.
  });
  app.use(cors({ origin: configuracion.origen, credentials: true })); // Permite que React envie la cookie de sesion al servidor.
  app.use(express.json({ limit: '32kb' })); // Lee cuerpos JSON y limita su tamano antes de llegar a los servicios.
  app.get('/api/health', (req, res) => res.json({ estado: 'ok' })); // Ofrece una ruta simple para comprobar que el proceso responde.
  app.use((req, res, next) => next(new ErrorHttp(404, 'NOT_FOUND', 'Ruta no encontrada.'))); // Normaliza las rutas inexistentes.
  app.use(manejarError); // Concentra al final la traduccion de todos los errores a HTTP/JSON.
  return app; // Entrega la aplicacion al arranque o a las pruebas.
}
