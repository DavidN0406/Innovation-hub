// Módulo de validación reutilizable. Cada función devuelve un mensaje de error, o "" si el valor es válido.

function validarRequerido(valor, nombre) {
  return valor.trim() === "" ? "Este campo es obligatorio." : "";
}

function validarLongitud(valor, min, max, nombre) {
  const largo = valor.trim().length;
  if (largo < min) return `${nombre} debe tener al menos ${min} caracteres.`;
  if (largo > max) return `${nombre} no puede superar los ${max} caracteres.`;
  return "";
}

function validarSeleccion(valor, nombre) {
  return valor === "" ? `Selecciona una opción en ${nombre}.` : "";
}

function validarEnteroEnRango(valor, min, max, nombre) {
 if (valor.trim() === "") return "Este campo es obligatorio.";
  const numero = Number(valor);
  if (!Number.isInteger(numero)) return `${nombre} debe ser un número entero.`;
  if (numero < min || numero > max) return `${nombre} debe estar entre ${min} y ${max}.`;
  return "";
}

function validarEtiquetas(valor, maxEtiquetas, maxLargo) {
  if (valor.trim() === "") return "";
  const etiquetas = valor.split(",").map((e) => e.trim()).filter(Boolean);
  if (etiquetas.length > maxEtiquetas) return `Podés usar hasta ${maxEtiquetas} etiquetas.`;
  if (etiquetas.some((e) => e.length > maxLargo)) return `Cada etiqueta puede tener hasta ${maxLargo} caracteres.`;
  return "";
}