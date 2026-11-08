import { leerConfiguracion } from './configuracion.js'; // Obtiene variables privadas validadas antes de iniciar.
import { crearApp } from './app.js'; // Separa el arranque HTTP de la construccion de rutas y middleware.

const configuracion = leerConfiguracion(); // Detiene el arranque si faltan variables obligatorias.
const app = crearApp(configuracion); // Prepara la aplicacion con el origen permitido del cliente.
const servidor = app.listen(configuracion.puerto, () => console.log(`API disponible en http://localhost:${configuracion.puerto}/api`)); // Abre el puerto solo al ejecutar este archivo.
process.on('SIGTERM', () => servidor.close()); // Cierra el puerto ordenadamente cuando el sistema detiene el proceso.
process.on('SIGINT', () => servidor.close()); // Atiende tambien la interrupcion desde la terminal.
