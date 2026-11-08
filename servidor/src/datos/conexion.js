import mongoose from 'mongoose'; // Comparte una sola conexion entre modelos, sesiones y servicios.

export async function conectarBase(uri) { // Abre MongoDB antes de aceptar solicitudes HTTP.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 }); // Limita la espera cuando la base configurada no responde.
  const capacidades = await mongoose.connection.db.admin().command({ hello: 1 }); // Consulta si MongoDB permite transacciones entre documentos.
  if (!capacidades.setName && capacidades.msg !== 'isdbgrid') { // Detecta instancias independientes que no pueden garantizar altas y conversiones atomicas.
    await mongoose.disconnect(); // Libera la conexion incompleta antes de informar el problema.
    throw new Error('MongoDB requiere un replica set; consulte servidor/README.md.'); // Explica la configuracion necesaria sin mostrar credenciales.
  }
}

export const desconectarBase = () => mongoose.disconnect(); // Centraliza el cierre usado por el arranque, las semillas y las pruebas.
