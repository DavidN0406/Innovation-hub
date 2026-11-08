import { exigir } from '../middleware/errores.js'; // Comparte los errores de validacion con todas las rutas.

export function objeto(valor) { // Verifica que el cuerpo o el filtro sea un objeto simple de JSON.
  exigir(valor !== null && typeof valor === 'object' && !Array.isArray(valor), 400, 'VALIDATION_ERROR', 'Envie un objeto JSON.'); // Rechaza null, arreglos y valores primitivos.
  return valor; // Devuelve los datos para continuar su validacion campo por campo.
}

export function camposPermitidos(datos, permitidos) { // Impide asignacion masiva de propietarios, roles o estados desde el cliente.
  objeto(datos); // Confirma la estructura antes de consultar sus claves.
  const desconocidos = Object.keys(datos).filter(campo => !permitidos.includes(campo)); // Identifica campos que no pertenecen al contrato de esa operacion.
  exigir(!desconocidos.length, 400, 'VALIDATION_ERROR', 'Hay campos no permitidos.', Object.fromEntries(desconocidos.map(campo => [campo, 'Campo no editable o desconocido.']))); // Informa cada campo rechazado sin ignorarlo silenciosamente.
}

export function texto(valor, campo, minimo = 1, maximo = 200) { // Normaliza y valida un campo textual con limites explicitos.
  exigir(typeof valor === 'string' && valor.trim().length >= minimo && valor.trim().length <= maximo, 400, 'VALIDATION_ERROR', 'Revise los campos indicados.', { [campo]: `Escriba entre ${minimo} y ${maximo} caracteres.` }); // Rechaza estructuras y longitudes invalidas antes de usarlas en consultas.
  return valor.trim(); // Conserva un valor limpio para la base de datos.
}

export function opcion(valor, campo, opciones) { // Comprueba enumeraciones de filtros y formularios.
  exigir(opciones.includes(valor), 400, 'VALIDATION_ERROR', 'Revise los campos indicados.', { [campo]: 'Seleccione un valor permitido.' }); // Rechaza valores ajenos a la lista del contrato.
  return valor; // Entrega el valor comprobado al servicio.
}

export function lista(valor, campo, { minimo = 0, maximo = 30, longitud = 100 } = {}) { // Valida arreglos de cadenas sin convertir objetos en texto.
  exigir(Array.isArray(valor) && valor.length >= minimo && valor.length <= maximo, 400, 'VALIDATION_ERROR', 'Revise los campos indicados.', { [campo]: `Use entre ${minimo} y ${maximo} elementos.` }); // Limita el tamano del arreglo recibido.
  const limpia = valor.map(elemento => texto(elemento, campo, 1, longitud)); // Revalida tambien cada elemento del arreglo.
  exigir(new Set(limpia).size === limpia.length, 400, 'VALIDATION_ERROR', 'Revise los campos indicados.', { [campo]: 'No repita elementos.' }); // Evita relaciones y competencias duplicadas.
  return limpia; // Devuelve el arreglo listo para persistencia.
}

export function paginacion(query, permitidos) { // Valida todos los filtros antes de construir una consulta MongoDB.
  camposPermitidos(query, [...permitidos, 'page', 'size']); // Rechaza filtros desconocidos y nombres de operadores.
  const entero = (valor, defecto, maximo, campo) => { // Resuelve un entero positivo sin aceptar decimales ni notacion ambigua.
    if (valor === undefined) return defecto; // Aplica un valor predeterminado solo cuando el parametro no fue enviado.
    exigir(typeof valor === 'string' && /^[1-9]\d*$/.test(valor) && Number.isSafeInteger(Number(valor)) && Number(valor) <= maximo, 400, 'VALIDATION_ERROR', 'Paginacion invalida.', { [campo]: `Indique un entero entre 1 y ${maximo}.` }); // Limita las paginas y el trabajo por peticion.
    return Number(valor); // Convierte exclusivamente numeros comprobados.
  };
  return { page: entero(query.page, 1, 1000000, 'page'), size: entero(query.size, 10, 100, 'size') }; // Unifica la paginacion de todos los listados.
}

export function filtroTexto(valor, campo, maximo = 200) { // Construye busquedas literales sin permitir operadores ni expresiones regulares del usuario.
  if (valor === undefined || valor === '') return null; // Un filtro ausente no restringe resultados.
  return { $regex: texto(valor, campo, 1, maximo).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }; // Escapa cada metacaracter antes de enviarlo a MongoDB.
}
