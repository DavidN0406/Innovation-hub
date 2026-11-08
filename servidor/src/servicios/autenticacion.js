import { Usuario } from '../datos/modelos.js'; // Conecta las credenciales con usuarios persistidos en MongoDB.
import { consultarUno, insertar } from '../datos/repositorio.js'; // Mantiene las consultas de autenticacion en la capa de datos.
import { generarHash, comprobarContrasena } from './contrasenas.js'; // Comparte el hashing scrypt para registro e inicio de sesion.
import { perfilPublico } from './usuarios.js'; // Reutiliza una proyeccion que nunca devuelve hashes al navegador.
import { camposPermitidos, texto, opcion } from './validacion.js'; // Verifica campos y valores antes de persistir credenciales.
import { exigir } from '../middleware/errores.js'; // Devuelve fallos de negocio y credenciales en el formato de la API.

const correoValido = valor => { // Normaliza de la misma forma el correo del registro y del acceso.
  const correo = texto(valor, 'correo', 3, 254).toLowerCase(); // Elimina espacios exteriores y diferencias de mayusculas.
  exigir(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo), 400, 'VALIDATION_ERROR', 'Revise los campos indicados.', { correo: 'Ingrese un correo valido.' }); // Rechaza correos incompletos o estructuras inesperadas.
  return correo; // Entrega la clave normalizada que protege el indice unico.
};
const contrasenaValida = valor => { // Limita credenciales sin eliminar espacios que formen parte de la contrasena.
  exigir(typeof valor === 'string' && valor.length >= 8 && valor.length <= 128, 400, 'VALIDATION_ERROR', 'Revise los campos indicados.', { contrasena: 'Use entre 8 y 128 caracteres.' }); // Acota el trabajo criptografico y evita claves demasiado cortas.
  return valor; // Conserva exactamente la contrasena introducida.
};

export async function registrar(datos) { // Crea una cuenta activa con todos los datos obligatorios del documento general.
  camposPermitidos(datos, ['nombre', 'primerApellido', 'segundoApellido', 'correo', 'contrasena', 'confirmacionContrasena', 'tipoMiembro', 'carrera', 'aceptaTerminos']); // Rechaza roles administrativos, hashes y campos de identidad enviados por el usuario.
  const correo = correoValido(datos.correo); // Valida el identificador de acceso antes de consultar la base.
  const contrasena = contrasenaValida(datos.contrasena); // Comprueba el formato antes de calcular el hash.
  exigir(datos.confirmacionContrasena === contrasena, 400, 'VALIDATION_ERROR', 'Revise los campos indicados.', { confirmacionContrasena: 'Las contrasenas deben coincidir.' }); // Aplica la confirmacion tambien en el servidor.
  exigir(datos.aceptaTerminos === true, 400, 'VALIDATION_ERROR', 'Debe aceptar los terminos.', { aceptaTerminos: 'Aceptacion obligatoria.' }); // No acepta cadenas que aparenten una confirmacion.
  const perfil = { nombre: texto(datos.nombre, 'nombre', 1, 100), primerApellido: texto(datos.primerApellido, 'primerApellido', 1, 100), segundoApellido: texto(datos.segundoApellido ?? '', 'segundoApellido', 0, 100), correo, tipoMiembro: opcion(datos.tipoMiembro, 'tipoMiembro', ['estudiante', 'docente', 'administrativo']), carrera: texto(datos.carrera, 'carrera', 1, 150), aceptaTerminos: true }; // Selecciona datos publicos de registro y fija la aceptacion validada.
  exigir(!await consultarUno(Usuario, { correo }), 409, 'CONFLICT', 'Ya existe una cuenta con ese correo.'); // Ofrece un mensaje claro; el indice unico cubre tambien las carreras concurrentes.
  const usuario = await insertar(Usuario, { ...perfil, hash: await generarHash(contrasena) }); // Persiste solo el hash, nunca la contrasena ni su confirmacion.
  return usuario; // Entrega el documento internamente para establecer la sesion y proyectar el perfil.
}

export async function autenticar(datos) { // Comprueba una cuenta activa usando exclusivamente credenciales del servidor.
  camposPermitidos(datos, ['correo', 'contrasena']); // Impide usar el body para atribuir otra identidad o permisos.
  const correo = correoValido(datos.correo); // Normaliza el correo con las mismas reglas del registro.
  const contrasena = contrasenaValida(datos.contrasena); // Limita el costo del intento de acceso.
  const usuario = await Usuario.findOne({ correo, activo: true }).select('+hash'); // Recupera el hash solo dentro de la verificacion de credenciales.
  const hash = usuario?.hash ?? await generarHash('cuenta-inexistente-temporal'); // Realiza trabajo criptografico tambien cuando la cuenta no existe.
  const coincide = await comprobarContrasena(contrasena, hash); // Compara el hash sin devolverlo ni registrarlo.
  exigir(usuario && coincide, 401, 'INVALID_CREDENTIALS', 'El correo o la contrasena son incorrectos.'); // Usa el mismo error para cuenta inexistente, inactiva o clave incorrecta.
  return usuario; // La ruta construye la respuesta mediante perfilPublico.
}

export async function establecerSesion(req, usuario) { // Cambia el identificador de sesion al autenticar para evitar fijacion de sesiones.
  await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve())); // Invalida la sesion previa antes de asignar el usuario.
  req.session.usuarioId = usuario.id; // Guarda solo la identidad, sin copiar datos de perfil ni credenciales.
  await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve())); // Espera la persistencia MongoDB antes de responder al navegador.
  return perfilPublico(usuario, true); // Entrega el perfil propio que necesita el cliente.
}
