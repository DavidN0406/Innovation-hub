export function perfilPublico(usuario, propio = false) { // Selecciona explicitamente los campos que puede recibir React.
  const perfil = { id: usuario.id, nombre: usuario.nombre, primerApellido: usuario.primerApellido, segundoApellido: usuario.segundoApellido, tipoMiembro: usuario.tipoMiembro, rol: usuario.tipoMiembro, carrera: usuario.carrera, descripcion: usuario.descripcion, disponible: usuario.disponible, competencias: usuario.competencias, intereses: usuario.intereses, portafolio: usuario.portafolio, fechaModificacion: usuario.fechaModificacion }; // Evita serializar directamente documentos que contengan informacion de seguridad.
  if (propio) perfil.correo = usuario.correo; // Entrega el correo solo al titular de la sesion o de su perfil.
  return perfil; // Nunca incluye hash, contrasena, secreto ni datos de la sesion.
}
