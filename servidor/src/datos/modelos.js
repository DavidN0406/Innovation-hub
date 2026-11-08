import mongoose from 'mongoose'; // Define esquemas, referencias e indices para la persistencia MongoDB.
import { randomUUID } from 'node:crypto'; // Genera identificadores opacos portables a una futura API relacional.
import { tipos, visibilidades, estadosIniciativa, estadosSolicitud, estadosProyecto } from './catalogos.js'; // Centraliza los valores permitidos del dominio.

const { Schema } = mongoose; // Obtiene el constructor de esquemas para todos los modelos.
const opciones = { timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaModificacion' }, versionKey: false, strict: 'throw' }; // Registra fechas y rechaza campos no definidos al escribir documentos.
const id = () => ({ type: String, default: randomUUID }); // Proporciona una clave independiente del tipo ObjectId de MongoDB.
const referencia = modelo => ({ type: String, ref: modelo, required: true }); // Describe relaciones mediante IDs simples reutilizables en el contrato.
const catalogo = new Schema({ _id: String, nombre: { type: String, required: true }, categoria: String }, opciones); // Almacena competencias y categorias controladas como documentos referenciables.

const usuario = new Schema({ // Mantiene informacion de perfil y seguridad en la coleccion de usuarios.
  _id: id(), // Genera el identificador unico que recibiran los clientes como id.
  nombre: { type: String, required: true }, // Conserva el nombre utilizado en perfiles y listas.
  primerApellido: { type: String, required: true }, // Cumple la informacion obligatoria del registro general.
  segundoApellido: { type: String, default: '' }, // Permite omitir el segundo apellido.
  correo: { type: String, required: true, lowercase: true, trim: true }, // Normaliza la clave de autenticacion antes del indice unico.
  hash: { type: String, required: true, select: false }, // Excluye el hash de todas las consultas ordinarias.
  tipoMiembro: { type: String, enum: ['estudiante', 'docente', 'administrativo'], default: 'estudiante' }, // Evita que un registro publico se atribuya permisos administrativos.
  carrera: { type: String, required: true }, // Permite filtrar colaboradores por su carrera o area.
  descripcion: { type: String, default: '' }, // Guarda la presentacion personal del perfil.
  disponible: { type: Boolean, default: true }, // Conserva una disponibilidad real y filtrable en la base.
  competencias: [{ type: String, ref: 'Competencia' }], // Referencia competencias del catalogo compartido con iniciativas.
  intereses: [String], // Embebe los intereses porque solo pertenecen al perfil.
  portafolio: { type: String, default: '' }, // Mantiene el enlace opcional del usuario.
  activo: { type: Boolean, default: true }, // Permite invalidar sesiones de una cuenta inactiva sin borrar su historial.
  aceptaTerminos: { type: Boolean, required: true }, // Registra la aceptacion necesaria para crear la cuenta.
}, opciones);
usuario.index({ correo: 1 }, { unique: true }); // Evita correos duplicados incluso ante registros simultaneos.
usuario.index({ activo: 1, disponible: 1, nombre: 1, _id: 1 }); // Ayuda al listado paginado de colaboradores activos.
usuario.index({ competencias: 1, activo: 1 }); // Facilita el filtro de usuarios por competencia.

const miembro = new Schema({ // Embebe el equipo para que cada iniciativa mantenga su composicion consistente.
  usuarioId: referencia('Usuario'), // Relaciona al integrante con su perfil actual.
  rol: { type: String, required: true }, // Conserva la funcion asignada al entrar al equipo.
  fechaIncorporacion: { type: Date, default: Date.now }, // Registra cuando se acepto al integrante.
}, { _id: false });
const retiro = new Schema({ usuarioId: referencia('Usuario'), fechaRetiro: { type: Date, default: Date.now }, motivo: { type: String, default: '' } }, { _id: false }); // Conserva trazabilidad de retiros sin borrar la solicitud original.
const iniciativa = new Schema({ // Agrupa los datos propios de una idea, necesidad o reto.
  _id: id(), titulo: { type: String, required: true }, tipo: { type: String, enum: tipos, required: true }, // Identifica y clasifica la iniciativa de manera obligatoria.
  resumen: { type: String, required: true }, descripcion: { type: String, required: true }, problema: { type: String, required: true }, beneficiarios: { type: String, required: true }, // Mantiene por separado la informacion resumida y la protegida.
  categoria: referencia('Categoria'), competencias: [{ type: String, ref: 'Competencia' }], etiquetas: [String], // Referencia catalogos reutilizables y embebe etiquetas exclusivas de esta iniciativa.
  participantesEstimados: { type: Number, min: 1, max: 50, required: true }, // Define el limite de integrantes incluyendo al propietario.
  visibilidad: { type: String, enum: visibilidades, required: true }, estado: { type: String, enum: estadosIniciativa, default: 'Publicada' }, // Guarda un unico nivel de acceso y el estado del ciclo de vida.
  propietarioId: referencia('Usuario'), equipo: [miembro], retiros: [retiro], revision: { type: Number, default: 0 }, // Conserva un propietario y permite serializar escrituras concurrentes sobre su equipo.
}, opciones);
iniciativa.index({ propietarioId: 1, _id: 1 }); // Optimiza consultas de las iniciativas propias.
iniciativa.index({ visibilidad: 1, estado: 1, _id: 1 }); // Apoya catalogos segun acceso y estado.
iniciativa.index({ 'equipo.usuarioId': 1 }); // Resuelve pertenencia al equipo sin descargar todas las iniciativas.
iniciativa.index({ competencias: 1, categoria: 1 }); // Acelera filtros combinados por competencia y categoria.

const solicitud = new Schema({ // Mantiene solicitudes independientes para conservar su historial de transiciones.
  _id: id(), iniciativaId: referencia('Iniciativa'), solicitanteId: referencia('Usuario'), // Relaciona iniciativa y solicitante sin duplicar sus perfiles.
  mensaje: { type: String, required: true }, competencias: [String], disponibilidad: { type: String, required: true }, rolSolicitado: { type: String, default: 'Colaborador' }, // Guarda la propuesta de colaboracion validada por el servicio.
  estado: { type: String, enum: estadosSolicitud, default: 'pendiente' }, fechaDecision: Date, respuesta: { type: String, default: '' }, // Registra la decision y mantiene solicitudes canceladas como historial.
}, opciones);
solicitud.index({ iniciativaId: 1, solicitanteId: 1 }, { unique: true, partialFilterExpression: { estado: 'pendiente' } }); // Impide dos pendientes del mismo usuario para una iniciativa aun bajo concurrencia.
solicitud.index({ solicitanteId: 1, fechaCreacion: -1, _id: 1 }); // Ordena eficientemente las solicitudes propias.
solicitud.index({ iniciativaId: 1, estado: 1, fechaCreacion: -1, _id: 1 }); // Ayuda a listar y filtrar solicitudes recibidas.

const proyecto = new Schema({ // Conserva el desarrollo formal y su vinculo permanente con el problema original.
  _id: id(), iniciativaId: referencia('Iniciativa'), nombre: { type: String, required: true }, descripcion: { type: String, required: true }, objetivo: { type: String, required: true }, // Identifica el proyecto y describe su proposito.
  fechaInicio: { type: String, required: true }, estado: { type: String, enum: estadosProyecto, required: true }, repositorio: { type: String, default: null }, // Usa fechas de calendario y una URL opcional portable a otro backend.
  tecnologias: [String], fechaFinEstimada: { type: String, default: null }, // Conserva informacion adicional del documento general sin exigirla al formulario actual.
}, opciones);
proyecto.index({ iniciativaId: 1 }, { unique: true }); // Garantiza una sola conversion por iniciativa.

export const Usuario = mongoose.model('Usuario', usuario, 'usuarios'); // Expone perfiles y fija el nombre real de su coleccion sin depender de plurales automaticos.
export const Competencia = mongoose.model('Competencia', catalogo, 'competencias'); // Expone el catalogo referenciado por perfiles e iniciativas.
export const Categoria = mongoose.model('Categoria', catalogo.clone(), 'categorias'); // Mantiene las categorias en su propia coleccion.
export const Iniciativa = mongoose.model('Iniciativa', iniciativa, 'iniciativas'); // Expone iniciativas y equipos embebidos a los servicios.
export const Solicitud = mongoose.model('Solicitud', solicitud, 'solicitudes'); // Expone solicitudes y evita que el plural automatico genere un nombre distinto al documentado.
export const Proyecto = mongoose.model('Proyecto', proyecto, 'proyectos'); // Expone proyectos vinculados a sus iniciativas.
export const modelos = [Usuario, Competencia, Categoria, Iniciativa, Solicitud, Proyecto]; // Permite preparar todos los indices antes de aceptar escrituras.
