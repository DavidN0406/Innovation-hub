import 'dotenv/config'; // Carga las variables privadas del archivo .env del servidor.

export function leerConfiguracion(entorno = process.env) { // Permite validar tambien configuraciones aisladas durante las pruebas.
  const puerto = Number(entorno.PORT ?? 3000); // Convierte el puerto recibido como texto en un numero.
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) throw new Error('PORT debe estar entre 1 y 65535.'); // Rechaza puertos invalidos antes de abrir la API.
  if (!entorno.MONGODB_URI?.startsWith('mongodb')) throw new Error('Configure MONGODB_URI.'); // Exige una conexion MongoDB explicita.
  if (!entorno.SESSION_SECRET || entorno.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET requiere al menos 32 caracteres.'); // Impide iniciar con sesiones firmadas mediante un secreto vacio o corto.
  const origen = entorno.CLIENT_ORIGIN ?? 'http://localhost:5173'; // Usa el origen local del cliente cuando no se configura otro.
  if (new URL(origen).origin !== origen) throw new Error('CLIENT_ORIGIN debe contener solo el origen, sin rutas.'); // Evita configuraciones CORS ambiguas.
  return { puerto, origen, mongoUri: entorno.MONGODB_URI, secreto: entorno.SESSION_SECRET, produccion: entorno.NODE_ENV === 'production' }; // Entrega un objeto validado a la aplicacion y a la conexion.
}
