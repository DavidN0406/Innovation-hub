import mongoose from 'mongoose'; // Comprueba la base destino para evitar cargar demostraciones en una base equivocada.
import { leerConfiguracion } from './configuracion.js'; // Reutiliza la configuracion privada y validada del servidor.
import { conectarBase, desconectarBase } from './datos/conexion.js'; // Controla el ciclo de vida de MongoDB durante la carga.
import { modelos, Proyecto } from './datos/modelos.js'; // Prepara indices y verifica conversiones demo existentes.
import { cargarSemillas } from './datos/semillas.js'; // Comparte los mismos datos reproducibles con las pruebas automaticas.

const configuracion = leerConfiguracion(); // Exige la URI y el secreto configurados fuera de Git.
try { // Garantiza el cierre de la conexion tanto si la carga funciona como si falla.
  await conectarBase(configuracion.mongoUri); // Verifica un replica set antes de modificar datos de prueba.
  if (!mongoose.connection.name.endsWith('_demo') || !process.argv.includes('--confirmar-demo')) throw new Error('Use una base terminada en _demo y npm run seed -- --confirmar-demo.'); // Exige una base de demostracion identificable y una confirmacion explicita.
  await Promise.all(modelos.map(modelo => modelo.init())); // Activa indices unicos antes de insertar las semillas.
  if (await Proyecto.exists({ iniciativaId: { $in: ['demo-convertir', 'demo-propia'] } })) throw new Error('Ya hay proyectos demo convertidos. Use otra base _demo para repetir desde cero.'); // Evita resetear una iniciativa dejando un proyecto anterior incoherente.
  console.log(JSON.stringify(await cargarSemillas(process.env.SEED_PASSWORD), null, 2)); // Informa IDs publicos para configurar la coleccion, sin mostrar la clave.
} finally { // Se ejecuta tambien ante URI incorrecta, indices duplicados o datos previos incompatibles.
  await desconectarBase(); // Libera MongoDB para que la tarea de carga finalice sin procesos pendientes.
}
