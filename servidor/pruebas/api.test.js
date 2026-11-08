import { before, after, beforeEach, test } from 'node:test'; // Ejecuta pruebas independientes de la interfaz con el runner oficial de Node.
import assert from 'node:assert/strict'; // Comprueba respuestas, permisos e invariantes de persistencia.
import { readFileSync } from 'node:fs'; // Lee las colecciones Postman sin modificarlas durante la ejecucion.
import { MongoMemoryReplSet } from 'mongodb-memory-server'; // Inicia un proceso MongoDB real y desechable con soporte de transacciones.
import request from 'supertest'; // Envia peticiones HTTP reales a Express manteniendo cookies por actor.
import newman from 'newman'; // Ejecuta las peticiones y aserciones originales de la coleccion Postman.
import { crearApp } from '../src/app.js'; // Usa exactamente las rutas y middleware que ejecuta el servidor normal.
import { conectarBase, desconectarBase } from '../src/datos/conexion.js'; // Reutiliza la misma conexion de produccion con una URI efimera.
import { modelos, Usuario, Iniciativa, Solicitud, Proyecto } from '../src/datos/modelos.js'; // Comprueba indices, relaciones y datos privados persistidos.
import { cargarSemillas, idsPrueba } from '../src/datos/semillas.js'; // Prepara escenarios reproducibles compartidos con Postman.
import { leerConfiguracion } from '../src/configuracion.js'; // Comprueba tambien errores de configuracion previos al arranque.

let replica, app, http; // Conserva recursos efimeros para cerrarlos incluso cuando una prueba falle.
const clave = 'Clave-exclusiva-pruebas-2026'; // Es una credencial ficticia que solo existe en la base temporal.
const configuracion = { origen: 'http://localhost:5173', secreto: 'secreto-exclusivo-para-pruebas-automaticas', produccion: false }; // Aisla las cookies de pruebas de cualquier entorno real.
const formulario = { titulo: 'Iniciativa creada desde HTTP', tipo: 'Idea', resumen: 'Resumen suficientemente largo para validar el formulario.', descripcion: 'Descripcion suficientemente larga para probar el formulario y persistir la informacion.', problema: 'Problema que se necesita solucionar en comunidad.', beneficiarios: 'Estudiantes universitarios', categoria: 'Tecnología', competencias: ['React'], participantesEstimados: 5, visibilidad: 'publica', etiquetas: ['prueba'] }; // Usa datos validos equivalentes a los del formulario React.
const propuesta = { mensaje: 'Quiero participar en esta iniciativa.', competencias: ['React'], disponibilidad: 'Lunes por la tarde' }; // Comparte el formato exacto de las solicitudes del cliente existente.
const proyecto = { nombre: 'Proyecto de prueba', descripcion: 'Descripcion del proyecto de prueba', objetivo: 'Comprobar el ciclo completo', fechaInicio: '2026-11-08', estado: 'planificado', repositorio: 'https://github.com/DavidN0406/Innovation-hub' }; // Ejercita conversion y persistencia de la referencia original.
const registro = correo => ({ nombre: 'Persona', primerApellido: 'Prueba', correo, contrasena: clave, confirmacionContrasena: clave, tipoMiembro: 'estudiante', carrera: 'Software', aceptaTerminos: true }); // Incluye todos los campos obligatorios del documento general.

before(async () => { // Prepara MongoDB real antes de cualquier peticion a la API.
  replica = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.14' } }); // Inicia un replica set local sin tocar bases de datos del usuario.
  await conectarBase(replica.getUri('innovation_hub_test')); // Comprueba tambien que el arranque detecta capacidades transaccionales.
  await Promise.all(modelos.map(modelo => modelo.init())); // Crea indices reales de correo unico, pendientes y conversion unica.
  app = crearApp(configuracion); // Construye la aplicacion con sesiones persistidas en esta base efimera.
  http = app.listen(0, '127.0.0.1'); // Reserva un puerto libre para ejecutar Postman contra HTTP real.
  await new Promise(resolve => http.once('listening', resolve)); // Espera el puerto antes de lanzar peticiones externas.
}, { timeout: 240000 });

beforeEach(async () => { // Restablece unicamente las colecciones de la instancia MongoDB temporal de este archivo.
  for (const modelo of modelos) await modelo.deleteMany({}); // Evita dependencias entre pruebas y escenarios anteriores.
  await cargarSemillas(clave); // Recupera catalogos, cuatro visibilidades y actores de prueba conocidos.
});

after(async () => { // Libera todos los recursos aunque haya errores durante la ejecucion.
  if (http) await new Promise(resolve => http.close(resolve)); // Deja de aceptar peticiones antes de cerrar MongoDB.
  await desconectarBase(); // Cierra la conexion compartida por modelos y sesiones.
  if (replica) await replica.stop(); // Detiene el proceso desechable y libera sus archivos temporales.
});

async function actor(nombre) { // Autentica una identidad con el login real en lugar de inyectar IDs de usuario.
  const agente = request.agent(app); // Conserva una cookie independiente para cada persona.
  await agente.post('/api/auth/login').send({ correo: `${nombre}@example.test`, contrasena: clave }).expect(200); // Usa cuentas de las semillas verificadas mediante scrypt.
  return agente; // Devuelve un cliente HTTP autenticado para el escenario.
}

test('J1: configuracion, CORS, JSON invalido y rutas desconocidas', async () => { // Comprueba validaciones previas y errores uniformes del servidor.
  assert.throws(() => leerConfiguracion({}), /MONGODB_URI/); // No permite iniciar sin URI de base de datos.
  assert.throws(() => leerConfiguracion({ MONGODB_URI: 'mongodb://localhost/test', SESSION_SECRET: 'corta' }), /SESSION_SECRET/); // Rechaza sesiones con un secreto debil.
  await request(app).get('/api/health').expect(200); // Comprueba disponibilidad basica del servicio.
  const cors = await request(app).get('/api/health').set('Origin', configuracion.origen).expect(200); // Consulta desde el origen exacto del cliente.
  assert.equal(cors.headers['access-control-allow-origin'], configuracion.origen); // Verifica que nunca se entregue un asterisco con credenciales.
  assert.equal(cors.headers['access-control-allow-credentials'], 'true'); // Confirma que el navegador puede enviar la sesion real.
  await request(app).post('/api/auth/login').set('Origin', 'https://otro.example').send({}).expect(403); // Bloquea solicitudes desde origen ajeno antes de procesar el body.
  await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{').expect(400); // Maneja JSON malformado sin revelar trazas.
  const inexistente = await request(app).get('/api/no-existe').expect(404); // Comprueba rutas desconocidas del contrato.
  assert.deepEqual(Object.keys(inexistente.body.error).sort(), ['code', 'fields', 'message']); // Exige la misma estructura publica en todos los errores.
});

test('J3: registro, correo unico, hashing, sesion regenerada y logout real', async () => { // Comprueba el ciclo completo de cuentas sobre MongoDB.
  const agente = request.agent(app); // Crea un navegador independiente del resto de los actores.
  const creado = await agente.post('/api/auth/register').send(registro('Nueva@Example.test')).expect(201); // Registra una cuenta y establece su cookie de sesion.
  assert.equal(creado.body.correo, 'nueva@example.test'); // Comprueba normalizacion del identificador de acceso.
  assert.equal(creado.body.hash, undefined); // Impide filtrar hashes en respuestas de registro.
  const persistido = await Usuario.findOne({ _id: creado.body.id }).select('+hash'); // Inspecciona el dato guardado en la base real.
  assert.ok(persistido.hash.startsWith('scrypt$')); // Verifica que el mecanismo de hashing implementado se uso realmente.
  assert.ok(!persistido.hash.includes(clave)); // Asegura que la contrasena no se guardo en texto plano.
  await request(app).post('/api/auth/register').send(registro('NUEVA@example.test')).expect(409); // El correo unico no distingue mayusculas.
  const sesion = creado.headers['set-cookie'][0].split(';')[0]; // Conserva la cookie antigua solo en memoria para comprobar revocacion.
  const acceso = await agente.post('/api/auth/login').send({ correo: 'nueva@example.test', contrasena: clave }).expect(200); // Inicia sesion nuevamente con credenciales reales.
  assert.notEqual(acceso.headers['set-cookie'][0].split(';')[0], sesion); // El identificador cambia para prevenir fijacion de sesion.
  await request(app).get('/api/auth/me').set('Cookie', sesion).expect(401); // La cookie anterior queda invalidada tambien en el servidor.
  const vigente = acceso.headers['set-cookie'][0].split(';')[0]; // Guarda la cookie vigente sin escribirla en reportes ni archivos.
  await agente.post('/api/auth/logout').expect(204); // Destruye la sesion persistida en MongoDB.
  await request(app).get('/api/auth/me').set('Cookie', vigente).expect(401); // Una copia de la cookie tampoco permite acceso despues del cierre.
  await agente.post('/api/auth/login').send({ correo: 'nueva@example.test', contrasena: 'Incorrecta123' }).expect(401); // No autentica una contrasena incorrecta.
});

test('J3: registro valida datos y protege campos administrativos', async () => { // Revisa validaciones adversarias independientes de React.
  for (const cambios of [{ primerApellido: '' }, { confirma: true }, { confirmacionContrasena: 'Distinta123' }, { aceptaTerminos: false }, { tipoMiembro: 'administrador' }, { correo: { $ne: null } }, { contrasena: 'corta' }]) { // Cubre campos obligatorios, confirmacion, roles e intentos de inyeccion.
    await request(app).post('/api/auth/register').send({ ...registro('validacion@example.test'), ...cambios }).expect(400); // Todos los datos invalidos se rechazan antes de crear una cuenta.
  }
  const resultados = await Promise.all([1, 2].map(() => request(app).post('/api/auth/register').send(registro('concurrente@example.test')))); // Simula dos registros simultaneos del mismo correo.
  assert.deepEqual(resultados.map(resultado => resultado.status).sort(), [201, 409]); // El indice unico permite exactamente una cuenta.
});

test('J4: perfiles propios, correo protegido y filtros combinados paginados', async () => { // Valida permisos y relacion de competencias con el catalogo.
  const propietario = await actor('propietario'); // Establece una sesion real para el titular del perfil.
  const otro = await propietario.get('/api/users/demo-ajeno').expect(200); // Consulta un perfil distinto como usuario autenticado.
  assert.equal(otro.body.correo, undefined); // Los perfiles ajenos no divulgan identificadores privados de autenticacion.
  const cambios = { nombre: 'Nuevo nombre', carrera: 'Software', disponible: false, competencias: ['React', 'JavaScript'], intereses: ['Web'] }; // Prepara campos que el perfil actual del cliente envia.
  await propietario.put('/api/users/demo-propietario').send(cambios).expect(200); // Persiste campos editables del titular.
  await propietario.put('/api/users/demo-ajeno').send(cambios).expect(403); // No permite editar a otra persona.
  await propietario.put('/api/users/demo-propietario').send({ ...cambios, correo: 'otro@example.test' }).expect(400); // El correo no se modifica desde el perfil.
  await propietario.put('/api/users/demo-propietario').send({ ...cambios, competencias: ['Inexistente'] }).expect(400); // No acepta referencias a competencias inexistentes.
  await propietario.put('/api/users/demo-propietario').send({ ...cambios, competencias: ['React', 'React'] }).expect(400); // Evita competencias repetidas en un usuario.
  const pagina = await propietario.get('/api/users?q=Nuevo&career=Software&skill=React&available=false&size=1').expect(200); // Combina todos los filtros en una consulta paginada real.
  assert.equal(pagina.body.total, 1); // Solo coincide el perfil actualizado.
  assert.equal(pagina.body.items[0].id, 'demo-propietario'); // Entrega el usuario esperado sin descargar toda la coleccion.
  const vacia = await propietario.get('/api/users?page=100&size=1').expect(200); // Consulta una pagina fuera de rango.
  assert.equal(vacia.body.page, 100); // Conserva el numero solicitado segun el contrato.
  assert.deepEqual(vacia.body.items, []); // Distingue un resultado vacio de un error.
  for (const ruta of ['/api/users?size=0', '/api/users?q[$ne]=x', '/api/users?available=si', '/api/users?sort=hash']) await propietario.get(ruta).expect(400); // Rechaza paginacion, operadores y ordenamientos ajenos al contrato.
  await propietario.get('/api/users/no-existe').expect(404); // Cubre el recurso inexistente del directorio.
  await request(app).get('/api/users').expect(401); // El directorio requiere autenticacion.
});

test('J4: competencias y categorias persisten con busqueda, errores y permisos', async () => { // Cubre los cuatro tipos de caso exigidos para cada catalogo.
  const propietario = await actor('propietario'); // Abre una sesion real para consultar listas controladas.
  for (const ruta of ['skills', 'categories']) { // Aplica las mismas pruebas a ambos recursos de solo lectura.
    const lista = await propietario.get(`/api/${ruta}?size=2`).expect(200); // Verifica una peticion correcta paginada.
    assert.equal(lista.body.items.length, 2); // No descarga el catalogo completo cuando se limita el tamano.
    await propietario.get(`/api/${ruta}?size=0`).expect(400); // Comprueba el filtro invalido.
    await propietario.get(`/api/${ruta}/inexistente`).expect(404); // Comprueba un identificador inexistente.
    await request(app).get(`/api/${ruta}`).expect(401); // Comprueba el acceso no autorizado.
  }
  const react = await propietario.get('/api/skills?q=React').expect(200); // Busca una competencia por texto literal.
  assert.equal(react.body.items[0].nombre, 'React'); // Resuelve el mismo valor usado en los formularios de los companeros.
});

test('J5: matriz de visibilidad completa sin filtracion de campos restringidos', async () => { // Verifica los cuatro niveles con visitante, tercero, miembro y propietario.
  const ajeno = await actor('ajeno'); // Representa un usuario autenticado que no integra el equipo.
  const miembro = await actor('miembro'); // Representa un integrante aceptado de restringida y privada.
  const propietario = await actor('propietario'); // Representa al autor de las iniciativas.
  await request(app).get('/api/initiatives/demo-publica').expect(200); // La informacion publica completa admite visitantes.
  for (const nivel of ['institucional', 'restringida', 'privada']) await request(app).get(`/api/initiatives/demo-${nivel}`).expect(404); // Los visitantes no exploran niveles que requieren identidad.
  const institucional = await ajeno.get('/api/initiatives/demo-institucional').expect(200); // Cualquier usuario autenticado accede a una institucional.
  assert.equal(institucional.body.accesoCompleto, true); // El nivel institucional permite detalle completo.
  const restringida = await ajeno.get('/api/initiatives/demo-restringida').expect(200); // Un tercero autenticado puede explorar el resumen restringido.
  assert.equal(restringida.body.accesoCompleto, false); // El servidor declara que no existe acceso completo.
  for (const campo of ['descripcion', 'problema', 'equipo', 'beneficiarios', 'etiquetas']) assert.equal(restringida.body[campo], undefined); // No entrega campos protegidos aunque se consulte la API directamente.
  assert.deepEqual(restringida.body.competencias, ['React']); // El resumen conserva las competencias requeridas autorizadas por el documento general.
  await ajeno.get('/api/initiatives/demo-privada').expect(404); // Una privada no revela su existencia a terceros.
  for (const agente of [miembro, propietario]) for (const nivel of ['restringida', 'privada']) { // Comprueba los actores autorizados en ambos niveles protegidos.
    const detalle = await agente.get(`/api/initiatives/demo-${nivel}`).expect(200); // Consulta mediante una sesion autentica de integrante o propietario.
    assert.equal(detalle.body.accesoCompleto, true); // Ambos actores reciben el detalle completo.
  }
  const catalogo = await ajeno.get('/api/initiatives?size=100').expect(200); // Comprueba permisos tambien antes de la paginacion del catalogo.
  assert.ok(!catalogo.body.items.some(item => item.id === 'demo-privada')); // El listado general no incluye privadas ajenas.
  assert.equal(catalogo.body.items.find(item => item.id === 'demo-restringida').descripcion, undefined); // El listado no sirve de atajo para leer una descripcion restringida.
  await ajeno.get('/api/initiatives/demo-restringida/team').expect(403); // El resumen no autoriza a consultar los integrantes.
  await miembro.get('/api/initiatives/demo-privada/team').expect(200); // Los miembros pueden consultar su equipo privado.
});

test('J5: ciclo CRUD, propietario unico, cupos, filtros y borradores', async () => { // Comprueba escrituras persistidas y estados que limitan el catalogo.
  const propietario = await actor('propietario'); // Usa al autor real para crear y editar iniciativas.
  const ajeno = await actor('ajeno'); // Intenta cambios sobre recursos ajenos.
  const creada = await propietario.post('/api/initiatives').send(formulario).expect(201); // Crea una iniciativa usando el contrato HTTP.
  const id = creada.body.id; // Conserva el ID generado por el servidor para el resto del ciclo.
  assert.equal(creada.body.equipo[0].usuarioId, 'demo-propietario'); // El propietario ingresa automaticamente al equipo.
  await propietario.post('/api/initiatives').send({ ...formulario, propietarioId: 'demo-ajeno' }).expect(400); // El body no puede sustituir la identidad de la sesion.
  await ajeno.put(`/api/initiatives/${id}`).send(formulario).expect(403); // La modificacion es exclusiva del propietario.
  await propietario.put(`/api/initiatives/${id}`).send({ ...formulario, titulo: 'Titulo modificado por su propietario' }).expect(200); // Modifica conservando identidad y fecha original.
  const guardada = await Iniciativa.findById(id); // Comprueba el cambio directamente en MongoDB.
  assert.equal(guardada.titulo, 'Titulo modificado por su propietario'); // La respuesta HTTP corresponde a persistencia real.
  await propietario.put('/api/initiatives/demo-propia').send({ ...formulario, participantesEstimados: 1 }).expect(409); // No permite reducir cupos por debajo del equipo existente.
  const pagina = await propietario.get('/api/initiatives?q=modificado&type=Idea&category=Tecnolog%C3%ADa&skill=React&spaces=true&size=1&sort=titulo-desc').expect(200); // Combina busqueda, filtros, cupos y orden antes de paginar.
  assert.equal(pagina.body.total, 1); // Identifica exclusivamente el recurso modificado.
  await Iniciativa.updateOne({ _id: id }, { $set: { estado: 'Borrador' } }); // Prepara el estado controlado de borrador sin inventar una ruta fuera del alcance.
  await ajeno.get(`/api/initiatives/${id}`).expect(404); // Un borrador no se revela a otros usuarios.
  await propietario.get(`/api/initiatives/${id}`).expect(200); // El propietario conserva acceso a su borrador.
  await propietario.delete(`/api/initiatives/${id}`).expect(204); // Elimina una iniciativa sin relaciones adicionales al autor.
  assert.equal(await Iniciativa.findById(id), null); // Confirma que la eliminacion fisica fue real.
  await propietario.delete('/api/initiatives/no-existe').expect(404); // Cubre recurso inexistente en operaciones destructivas.
  await request(app).post('/api/initiatives').send(formulario).expect(401); // Ningun visitante puede publicar.
});

test('J5: las relaciones historicas obligan a archivar y se conservan', async () => { // Comprueba archivado frente a solicitudes, miembros y retiros.
  const propietario = await actor('propietario'); // Solo el autor puede decidir la eliminacion o el archivo.
  const ajeno = await actor('ajeno'); // Comprueba que el recurso archivado se oculta a terceros.
  const archivada = await propietario.delete('/api/initiatives/demo-propia').expect(200); // Solicitudes y otro miembro impiden eliminar fisicamente.
  assert.equal(archivada.body.accion, 'archivada'); // La API informa que se conservo la informacion relacionada.
  assert.equal((await Iniciativa.findById('demo-propia')).estado, 'Archivada'); // El estado queda persistido en MongoDB.
  assert.ok(await Solicitud.exists({ iniciativaId: 'demo-propia' })); // No se borran solicitudes historicas al archivar.
  await ajeno.get('/api/initiatives/demo-propia').expect(404); // El archivo no continua publicado en el catalogo de terceros.
  await propietario.put('/api/initiatives/demo-propia').send(formulario).expect(409); // Una iniciativa archivada no permite modificaciones.
  await propietario.delete('/api/initiatives/demo-propia').expect(409); // La repeticion del archivado devuelve conflicto.
});

test('J6: propias pendientes, duplicados, edicion, cancelacion y proteccion de identidad', async () => { // Comprueba el ciclo del solicitante con datos persistidos.
  const solicitante = await actor('solicitante'); // Usa la identidad que pide participar.
  const ajeno = await actor('ajeno'); // Intenta leer y editar solicitudes que no le pertenecen.
  const creada = await solicitante.post('/api/initiatives/demo-publica/requests').send(propuesta).expect(201); // Crea una solicitud pendiente propia.
  const id = creada.body.id; // Conserva el identificador generado por el servidor.
  assert.equal(creada.body.solicitanteId, 'demo-solicitante'); // El solicitante se toma de la cookie, no del body.
  await solicitante.post('/api/initiatives/demo-publica/requests').send(propuesta).expect(409); // No permite dos pendientes para la misma iniciativa.
  await solicitante.post('/api/initiatives/demo-publica/requests').send({ ...propuesta, solicitanteId: 'demo-ajeno' }).expect(400); // Protege la identidad frente a campos adicionales.
  await ajeno.get(`/api/requests/${id}`).expect(403); // No permite leer mensajes privados de terceros.
  await ajeno.put(`/api/requests/${id}`).send(propuesta).expect(403); // No permite editar solicitudes ajenas.
  await solicitante.put(`/api/requests/${id}`).send({ ...propuesta, mensaje: 'Mensaje actualizado' }).expect(200); // Edita una pendiente conservando sus referencias.
  await solicitante.patch(`/api/requests/${id}/status`).send({ estado: 'cancelada' }).expect(200); // Cancela la solicitud sin eliminar su historial.
  await solicitante.put(`/api/requests/${id}`).send(propuesta).expect(409); // La cancelada ya no puede modificarse.
  await solicitante.patch(`/api/requests/${id}/status`).send({ estado: 'cancelada' }).expect(409); // Una transicion terminal no puede repetirse.
  await solicitante.post('/api/initiatives/demo-publica/requests').send(propuesta).expect(201); // Permite una nueva pendiente despues de cancelar si no pertenece al equipo.
  const pagina = await solicitante.get('/api/requests?scope=mine&status=pendiente&initiativeId=demo-publica&size=1').expect(200); // Filtra las propias en el servidor.
  assert.equal(pagina.body.total, 1); // El historial cancelado no se mezcla con pendientes.
  await solicitante.post('/api/initiatives/demo-privada/requests').send(propuesta).expect(403); // No permite pedir participacion usando un ID privado ajeno.
  await solicitante.post('/api/initiatives/no-existe/requests').send(propuesta).expect(404); // Cubre iniciativa inexistente.
});

test('J6-J7: solicitudes concurrentes no duplican pendientes ni equipo', async () => { // Comprueba las invariantes con peticiones paralelas al mismo recurso.
  const solicitante = await actor('solicitante'); // Abre una sesion para crear dos solicitudes a la vez.
  const propietario = await actor('propietario'); // Abre la sesion que puede resolver esas solicitudes.
  const creaciones = await Promise.all([1, 2].map(() => solicitante.post('/api/initiatives/demo-publica/requests').send(propuesta))); // Provoca una carrera entre comprobacion e insercion.
  assert.deepEqual(creaciones.map(resultado => resultado.status).sort(), [201, 409]); // Exactamente una peticion crea la pendiente.
  const id = creaciones.find(resultado => resultado.status === 201).body.id; // Recupera la solicitud confirmada por MongoDB.
  const decisiones = await Promise.all([1, 2].map(() => propietario.patch(`/api/requests/${id}/status`).send({ estado: 'aceptada' }))); // Intenta aceptar la misma pendiente simultaneamente.
  assert.deepEqual(decisiones.map(resultado => resultado.status).sort(), [200, 409]); // Solo una decision puede confirmar la transicion.
  const iniciativa = await Iniciativa.findById('demo-publica'); // Inspecciona el equipo resultante en la base real.
  assert.equal(iniciativa.equipo.filter(miembro => miembro.usuarioId === 'demo-solicitante').length, 1); // No existen dos membresias para la misma persona.
  assert.equal((await Solicitud.findById(id)).estado, 'aceptada'); // La decision corresponde al alta efectivamente persistida.
});

test('J7: permisos de decision, rechazo, capacidad y listado recibido', async () => { // Verifica que solo el propietario decide y el alta es consistente.
  const propietario = await actor('propietario'); // Representa al responsable de las iniciativas de semillas.
  const ajeno = await actor('ajeno'); // Intenta resolver solicitudes sin propiedad.
  await ajeno.patch('/api/requests/demo-solicitud-aceptar/status').send({ estado: 'aceptada' }).expect(403); // Ocultar un boton no sustituye esta comprobacion del servidor.
  await propietario.patch('/api/requests/demo-solicitud-aceptar/status').send({ estado: 'inventada' }).expect(400); // Rechaza estados que no representan una transicion permitida.
  await propietario.patch('/api/requests/demo-solicitud-rechazar/status').send({ estado: 'rechazada', respuesta: 'No corresponde al perfil requerido.' }).expect(200); // Conserva el comentario opcional del propietario.
  assert.ok(!(await Iniciativa.findById('demo-propia')).equipo.some(miembro => miembro.usuarioId === 'demo-rechazar')); // Rechazar nunca incorpora al solicitante al equipo.
  const rechazado = await actor('rechazar'); // Usa al solicitante cuya solicitud ya termino.
  await rechazado.put('/api/requests/demo-solicitud-rechazar').send(propuesta).expect(409); // No permite modificar una rechazada.
  await Iniciativa.updateOne({ _id: 'demo-propia' }, { $set: { participantesEstimados: 2 } }); // Llena exactamente los cupos disponibles con los miembros actuales.
  await propietario.patch('/api/requests/demo-solicitud-aceptar/status').send({ estado: 'aceptada' }).expect(409); // No acepta miembros si ya no hay capacidad.
  assert.equal((await Solicitud.findById('demo-solicitud-aceptar')).estado, 'pendiente'); // El fallo revierte cualquier escritura parcial de la solicitud.
  const recibidas = await propietario.get('/api/requests?scope=received&status=pendiente&skill=React&role=Desarrollo&initiativeId=demo-propia&size=2').expect(200); // Combina filtros despues de verificar propiedad en MongoDB.
  assert.equal(recibidas.body.items.length, 2); // Limita el resultado a la pagina solicitada.
  const ajenas = await ajeno.get('/api/requests?scope=received').expect(200); // Un usuario sin iniciativas no recibe solicitudes de otros autores.
  assert.equal(ajenas.body.total, 0); // El filtro de propiedad se aplica antes del conteo.
});

test('J7: retiro autorizado con trazabilidad y propietario protegido', async () => { // Comprueba permisos, errores y conservacion del propietario automatico.
  const propietario = await actor('propietario'); // Abre la sesion autorizada a retirar miembros.
  const ajeno = await actor('ajeno'); // Abre una identidad ajena al equipo.
  await ajeno.delete('/api/initiatives/demo-propia/team/demo-miembro').expect(403); // Un tercero no puede retirar integrantes.
  await propietario.delete('/api/initiatives/demo-propia/team/demo-propietario').expect(409); // El propietario no puede retirarse a si mismo.
  await propietario.delete('/api/initiatives/demo-propia/team/no-existe').expect(404); // No informa exito para un integrante inexistente.
  await propietario.delete('/api/initiatives/demo-propia/team/demo-miembro').expect(204); // Retira correctamente a un miembro diferente del propietario.
  const iniciativa = await Iniciativa.findById('demo-propia'); // Comprueba efectos reales de la operacion en MongoDB.
  assert.equal(iniciativa.equipo.length, 1); // Conserva exclusivamente al propietario en este escenario.
  assert.equal(iniciativa.retiros[0].usuarioId, 'demo-miembro'); // Mantiene la referencia historica del miembro retirado.
  assert.ok(iniciativa.retiros[0].fechaRetiro); // Guarda cuando se ejecuto el retiro.
});

test('J8: conversion atomica, referencia original, listado y visibilidad de proyectos', async () => { // Comprueba el ciclo requerido de proyectos sin alterar el cliente.
  const propietario = await actor('propietario'); // Solo el autor puede iniciar la conversion.
  const ajeno = await actor('ajeno'); // Comprueba permisos y acceso a proyectos publicos.
  await propietario.post('/api/initiatives/demo-sin-miembros/projects').send(proyecto).expect(409); // Exige otro integrante ademas del propietario.
  await ajeno.post('/api/initiatives/demo-convertir/projects').send(proyecto).expect(403); // No permite convertir iniciativas ajenas.
  for (const cambios of [{ fechaInicio: '2026-02-30' }, { repositorio: 'https://github.com/a/b?token=privado' }, { fechaFinEstimada: '2020-01-01' }]) await propietario.post('/api/initiatives/demo-convertir/projects').send({ ...proyecto, ...cambios }).expect(400); // Rechaza fechas imposibles, URL con credenciales y relaciones de fecha invalidas.
  const creada = await propietario.post('/api/initiatives/demo-convertir/projects').send(proyecto).expect(201); // Convierte un recurso que cumple las reglas.
  assert.equal(creada.body.iniciativaId, 'demo-convertir'); // Conserva la referencia a la iniciativa de origen.
  assert.equal((await Iniciativa.findById('demo-convertir')).estado, 'Convertida'); // La iniciativa se conserva con estado compatible con React.
  await propietario.post('/api/initiatives/demo-convertir/projects').send(proyecto).expect(409); // No permite generar un segundo proyecto.
  await ajeno.get(`/api/projects/${creada.body.id}`).expect(200); // Un proyecto de iniciativa publica es accesible a usuarios autenticados.
  const pagina = await ajeno.get('/api/projects?size=1').expect(200); // Lista proyectos visibles con paginacion en MongoDB.
  assert.equal(pagina.body.total, 1); // El conteo refleja los proyectos accesibles, no todos los documentos.
  await Iniciativa.updateOne({ _id: 'demo-convertir' }, { $set: { visibilidad: 'privada' } }); // Cambia el origen para comprobar que los permisos no se copiaron al proyecto.
  await ajeno.get(`/api/projects/${creada.body.id}`).expect(404); // La consulta directa revalida la visibilidad actual de la iniciativa.
  const privada = await ajeno.get('/api/projects').expect(200); // Revalida tambien los permisos del listado.
  assert.equal(privada.body.total, 0); // Una privada no filtra informacion por el conteo de proyectos.
  await propietario.get(`/api/projects/${creada.body.id}`).expect(200); // El propietario conserva acceso a su proyecto privado.
});

test('J8: conversion concurrente y retiro simultaneo mantienen invariantes', async () => { // Provoca carreras de escritura que una prueba secuencial no detecta.
  const propietario = await actor('propietario'); // Todas las decisiones se realizan con una sesion realmente autorizada.
  const resultados = await Promise.all([1, 2].map(() => propietario.post('/api/initiatives/demo-convertir/projects').send(proyecto))); // Intenta dos conversiones simultaneas de la misma iniciativa.
  assert.deepEqual(resultados.map(resultado => resultado.status).sort(), [201, 409]); // Solo una transaccion crea el proyecto.
  assert.equal(await Proyecto.countDocuments({ iniciativaId: 'demo-convertir' }), 1); // El indice unico tambien protege la persistencia.
  const carrera = await Promise.all([propietario.post('/api/initiatives/demo-restringida/projects').send(proyecto), propietario.delete('/api/initiatives/demo-restringida/team/demo-miembro')]); // Cruza conversion con retiro del unico integrante adicional.
  assert.equal(carrera[1].status, 204); // El retiro autorizado debe completarse sin duplicar o perder miembros.
  assert.ok([201, 409].includes(carrera[0].status)); // La conversion solo gana si verifico el miembro antes del retiro serializado.
  const cantidad = await Proyecto.countDocuments({ iniciativaId: 'demo-restringida' }); // Comprueba el resultado confirmado de la carrera.
  assert.equal(cantidad, carrera[0].status === 201 ? 1 : 0); // No quedan proyectos parciales ante una conversion rechazada.
});

test('J10: rutas protegidas, inactivos y fallos internos controlados', async () => { // Examina errores transversales que atraviesan varios modulos.
  for (const ruta of ['/api/auth/me', '/api/users', '/api/requests', '/api/projects', '/api/skills', '/api/categories', '/api/initiatives/demo-propia/team', '/api/initiatives?scope=owned']) await request(app).get(ruta).expect(401); // Todas las rutas privadas rechazan visitantes antes de devolver informacion.
  const propietario = await actor('propietario'); // Abre una sesion que se invalidara mediante el estado real de la cuenta.
  await Usuario.updateOne({ _id: 'demo-propietario' }, { $set: { activo: false } }); // Simula una cuenta desactivada conservando su historial.
  await propietario.get('/api/auth/me').expect(401); // Revalida la cuenta aunque la cookie aun exista.
  const ajeno = await actor('ajeno'); // Usa otra cuenta activa para provocar un fallo controlado de datos.
  const original = Usuario.findOne; // Conserva la consulta original para restaurarla despues de la prueba.
  Usuario.findOne = () => { throw new Error('fallo interno deliberado con datos privados'); }; // Simula un error interno sin desconectar bases ni modificar datos reales.
  try { // Restaura el modelo incluso si falla una asercion.
    const fallo = await ajeno.get('/api/auth/me').expect(500); // Comprueba que Express captura rechazos de middleware asincrono.
    assert.equal(fallo.body.error.code, 'INTERNAL_ERROR'); // Mantiene el mismo formato de error en fallos inesperados.
    assert.ok(!JSON.stringify(fallo.body).includes('deliberado')); // No revela el mensaje interno ni una traza al cliente.
  } finally { Usuario.findOne = original; } // Evita que la simulacion afecte otras pruebas.
});

test('J10: coleccion Postman de Gustavo contra HTTP y MongoDB reales', async () => { // Ejecuta las 38 peticiones y aserciones originales sin modificar archivos de los companeros.
  const coleccion = JSON.parse(readFileSync(new URL('../../pruebas/participacion.postman_collection.json', import.meta.url), 'utf8')); // Lee la coleccion existente del repositorio.
  const variables = { ...idsPrueba, baseUrl: `http://127.0.0.1:${http.address().port}/api`, idInexistente: '000000000000000000000000' }; // Usa datos efimeros equivalentes a los requeridos por su guia.
  for (const [etiqueta, nombre] of [['Propietario', 'propietario'], ['Solicitante', 'solicitante'], ['Ajeno', 'ajeno']]) { // Prepara tres sesiones reales separadas para los casos de permiso.
    const acceso = await request(app).post('/api/auth/login').send({ correo: `${nombre}@example.test`, contrasena: clave }).expect(200); // Autentica cada cuenta mediante scrypt y MongoDB.
    variables[`cookie${etiqueta}`] = acceso.headers['set-cookie'][0].split(';')[0]; // Mantiene cookies exclusivamente en memoria, fuera de archivos y reportes.
  }
  coleccion.variable = coleccion.variable.map(variable => ({ ...variable, value: variables[variable.key] ?? variable.value })); // Inyecta valores en una copia sin cambiar la coleccion de Gustavo.
  const resumen = await new Promise((resolve, reject) => newman.run({ collection: coleccion, reporters: [], timeoutRequest: 15000 }, (error, resultado) => error ? reject(error) : resolve(resultado))); // Ejecuta HTTP y las aserciones pm.test originales con Newman.
  assert.equal(resumen.run.stats.requests.total, 38); // Confirma que se ejecutaron todos los casos del aporte existente.
  assert.deepEqual(resumen.run.failures.map(fallo => `${fallo.source?.name}: ${fallo.error.message}`), []); // Exige cero fallos sin imprimir cookies ni credenciales.
});

test('J10: coleccion adicional de autenticacion, perfiles, catalogos e iniciativas', async () => { // Completa los recursos que no pertenecian a la coleccion original de participacion.
  const coleccion = JSON.parse(readFileSync(new URL('../../pruebas/servidor.postman_collection.json', import.meta.url), 'utf8')); // Lee el documento entregable de Postman sin alterar sus valores exportados.
  coleccion.variable = coleccion.variable.map(variable => ({ ...variable, value: variable.key === 'baseUrl' ? `http://127.0.0.1:${http.address().port}/api` : variable.key === 'clavePruebas' ? clave : variable.value })); // Configura puerto y clave ficticia solo en memoria para esta ejecucion.
  const resumen = await new Promise((resolve, reject) => newman.run({ collection: coleccion, reporters: [], timeoutRequest: 15000 }, (error, resultado) => error ? reject(error) : resolve(resultado))); // Usa el mismo ejecutor Postman y un servidor HTTP real.
  assert.equal(resumen.run.stats.requests.total, 27); // Verifica que todos los casos adicionales se ejecutaron.
  assert.deepEqual(resumen.run.failures.map(fallo => `${fallo.source?.name}: ${fallo.error.message}`), []); // Comprueba estados, errores uniformes, ausencia de hash y logout sin divulgar credenciales.
});
