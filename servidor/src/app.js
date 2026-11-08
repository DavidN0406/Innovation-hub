import express from 'express'; // Proporciona el servidor HTTP y el enrutamiento de la API.
import cors from 'cors'; // Agrega las cabeceras necesarias para el cliente React en otro puerto.
import session from 'express-session'; // Administra cookies firmadas y sesiones regenerables del lado del servidor.
import MongoStore from 'connect-mongo'; // Persiste sesiones en MongoDB para invalidarlas realmente al cerrar sesion.
import mongoose from 'mongoose'; // Comparte con el almacen de sesiones la conexion validada al iniciar.
import { ErrorHttp, manejarError } from './middleware/errores.js'; // Reutiliza el formato uniforme de errores.
import { cargarActor } from './middleware/sesion.js'; // Obtiene una identidad activa a partir de la sesion guardada.
import { rutasAutenticacion } from './rutas/autenticacion.js'; // Monta registro, acceso, consulta y cierre de sesion.
import { rutasUsuarios } from './rutas/usuarios.js'; // Monta perfiles y busqueda de colaboradores autenticados.
import { rutasCatalogos } from './rutas/catalogos.js'; // Monta competencias y categorias usadas por los formularios.
import { rutasIniciativas } from './rutas/iniciativas.js'; // Monta el catalogo y las escrituras autorizadas de iniciativas.
import { rutasSolicitudes } from './rutas/solicitudes.js'; // Monta solicitudes propias y decisiones del propietario.
import { rutasEquipos } from './rutas/equipos.js'; // Monta consultas y retiros de integrantes del equipo.
import { rutasProyectos } from './rutas/proyectos.js'; // Monta conversion atomica y consultas de proyectos accesibles.

export function crearApp(configuracion) { // Construye la aplicacion sin abrir puertos para facilitar pruebas aisladas.
  const app = express(); // Crea una instancia independiente de Express.
  app.locals.configuracion = configuracion; // Comparte atributos de cookies sin exponerlos en las respuestas.
  app.disable('x-powered-by'); // Evita publicar la tecnologia del servidor en las respuestas.
  app.use((req, res, next) => { // Verifica el origen antes de procesar peticiones con credenciales.
    if (req.headers.origin && req.headers.origin !== configuracion.origen) return next(new ErrorHttp(403, 'ORIGIN_FORBIDDEN', 'Origen no autorizado.')); // Rechaza navegadores de origen distinto al cliente configurado.
    next(); // Permite herramientas locales sin Origin y el cliente autorizado.
  });
  app.use(cors({ origin: configuracion.origen, credentials: true })); // Permite que React envie la cookie de sesion al servidor.
  app.use(express.json({ limit: '32kb' })); // Lee cuerpos JSON y limita su tamano antes de llegar a los servicios.
  app.get('/api/health', (req, res) => res.json({ estado: 'ok' })); // Ofrece una ruta simple para comprobar que el proceso responde.
  const almacen = MongoStore.create({ client: mongoose.connection.getClient(), collectionName: 'sesiones', ttl: 28800 }); // Usa la conexion existente y limita las sesiones a ocho horas.
  app.locals.almacenSesiones = almacen; // Permite detener el almacen de forma controlada durante el cierre y las pruebas.
  app.use(session({ name: 'innovation.sid', secret: configuracion.secreto, store: almacen, resave: false, saveUninitialized: false, cookie: { httpOnly: true, secure: configuracion.produccion, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000, path: '/' } })); // Guarda solo un identificador firmado en una cookie que JavaScript no puede leer.
  app.use(cargarActor); // Resuelve el usuario activo antes de evaluar permisos de cualquier recurso.
  app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }); // Evita almacenar perfiles o respuestas privadas en caches compartidas.
  app.use('/api/auth', rutasAutenticacion); // Conecta las rutas de cuentas con las sesiones persistidas.
  app.use('/api/users', rutasUsuarios); // Conecta los perfiles con identidad y permisos del servidor.
  app.use('/api', rutasCatalogos); // Comparte el prefijo base para competencias y categorias.
  app.use('/api/initiatives', rutasIniciativas); // Publica catalogo y detalle con control de visibilidad.
  app.use('/api', rutasSolicitudes); // Conserva los endpoints de participacion que consume React.
  app.use('/api', rutasEquipos); // Expone el equipo sin modificar las pantallas existentes.
  app.use('/api', rutasProyectos); // Expone conversion y proyectos con referencias estables.
  app.use((req, res, next) => next(new ErrorHttp(404, 'NOT_FOUND', 'Ruta no encontrada.'))); // Normaliza las rutas inexistentes.
  app.use(manejarError); // Concentra al final la traduccion de todos los errores a HTTP/JSON.
  return app; // Entrega la aplicacion al arranque o a las pruebas.
}
