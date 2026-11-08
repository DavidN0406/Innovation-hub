import { leerConfiguracion } from './configuracion.js'; // Obtiene variables privadas validadas antes de iniciar.
import { crearApp } from './app.js'; // Separa el arranque HTTP de la construccion de rutas y middleware.
import { conectarBase, desconectarBase } from './datos/conexion.js'; // Conecta MongoDB antes de abrir el servidor y lo libera al detenerlo.
import { modelos } from './datos/modelos.js'; // Prepara los indices unicos antes de aceptar solicitudes concurrentes.

const configuracion = leerConfiguracion(); // Detiene el arranque si faltan variables obligatorias.
await conectarBase(configuracion.mongoUri); // Verifica conectividad y soporte de transacciones antes de atender HTTP.
await Promise.all(modelos.map(modelo => modelo.init())); // Espera que existan los indices de correo, pendientes y conversion unica.
const app = crearApp(configuracion); // Prepara la aplicacion con el origen permitido del cliente.
const servidor = app.listen(configuracion.puerto, () => console.log(`API disponible en http://localhost:${configuracion.puerto}/api`)); // Abre el puerto solo al ejecutar este archivo.
const detener = () => servidor.close(async () => { await desconectarBase(); }); // Cierra primero HTTP y despues la conexion compartida por modelos y sesiones.
process.on('SIGTERM', detener); // Cierra el servicio ordenadamente cuando lo detiene el sistema.
process.on('SIGINT', detener); // Atiende tambien la interrupcion desde la terminal.
