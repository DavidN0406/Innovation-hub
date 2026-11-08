export class ErrorHttp extends Error { // Representa un fallo esperado que puede explicarse al cliente.
  constructor(estado, code, message, fields = {}) { // Recibe el estado HTTP y el formato uniforme acordado con React.
    super(message); // Conserva el mensaje y la traza estandar de JavaScript.
    Object.assign(this, { estado, code, fields }); // Guarda los datos necesarios para formar la respuesta JSON.
  }
}

export function exigir(condicion, estado, codigo, mensaje, campos) { // Centraliza las precondiciones de los servicios.
  if (!condicion) throw new ErrorHttp(estado, codigo, mensaje, campos); // Interrumpe la operacion antes de escribir si una regla no se cumple.
}

export function manejarError(error, req, res, next) { // Express invoca este middleware al fallar una ruta o un servicio.
  if (res.headersSent) return next(error); // Delega errores tardios cuando ya no es posible enviar otro JSON.
  if (error.code === 11000) error = new ErrorHttp(409, 'CONFLICT', 'Ya existe un registro con esos datos.'); // Traduce los indices unicos de MongoDB en conflictos de negocio.
  if (error.name === 'ValidationError' || error.name === 'CastError') error = new ErrorHttp(400, 'VALIDATION_ERROR', 'Revise los datos enviados.'); // Evita exponer detalles internos del modelo.
  if (error.type === 'entity.parse.failed') error = new ErrorHttp(400, 'INVALID_JSON', 'El cuerpo debe ser JSON valido.'); // Informa cuerpos JSON malformados sin responder 500.
  if (error.type === 'entity.too.large') error = new ErrorHttp(413, 'BODY_TOO_LARGE', 'El cuerpo supera el limite permitido.'); // Mantiene el mismo formato para peticiones demasiado grandes.
  const esperado = error instanceof ErrorHttp; // Distingue errores controlados de fallos internos inesperados.
  if (!esperado) console.error('Error interno del servidor:', error.message); // Registra el fallo sin imprimir cuerpos, cookies ni contrasenas.
  return res.status(esperado ? error.estado : 500).json({ error: { code: esperado ? error.code : 'INTERNAL_ERROR', message: esperado ? error.message : 'No se pudo completar la operacion.', fields: esperado ? error.fields : {} } }); // Devuelve el contrato de error sin filtrar trazas al navegador.
}
