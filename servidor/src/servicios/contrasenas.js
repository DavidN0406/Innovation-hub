import { randomBytes, scrypt as derivar, timingSafeEqual } from 'node:crypto'; // Utiliza primitivas criptograficas mantenidas por Node.js.
import { promisify } from 'node:util'; // Convierte scrypt en una funcion asincrona que no bloquea el servidor.

const scrypt = promisify(derivar); // Reutiliza la version que devuelve una promesa en registro e inicio de sesion.
const parametros = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }; // Define el costo de memoria y calculo de cada contrasena.

export async function generarHash(contrasena) { // Transforma una contrasena en una representacion irreversible para MongoDB.
  const sal = randomBytes(16).toString('hex'); // Genera una sal distinta para cada cuenta, aunque repitan contrasena.
  const clave = await scrypt(contrasena, sal, 64, parametros); // Deriva una clave costosa de verificar para dificultar ataques por diccionario.
  return `scrypt$${sal}$${clave.toString('hex')}`; // Guarda algoritmo, sal y hash sin almacenar el texto original.
}

export async function comprobarContrasena(contrasena, almacenado) { // Verifica credenciales sin descifrar informacion de la cuenta.
  const [algoritmo, sal, hash] = almacenado.split('$'); // Recupera las partes del formato generado por el registro.
  if (algoritmo !== 'scrypt' || !sal || !/^[a-f0-9]{128}$/.test(hash ?? '')) return false; // Rechaza hashes incompletos o de un formato desconocido.
  const calculado = await scrypt(contrasena, sal, 64, parametros); // Repite la derivacion usando la sal de esa cuenta.
  return timingSafeEqual(calculado, Buffer.from(hash, 'hex')); // Compara buffers del mismo tamano sin revelar diferencias por posicion.
}
