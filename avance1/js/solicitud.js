// Pantalla de solicitud de participación. Simula el envío guardando la solicitud en localStorage.
const RUTA_INICIATIVAS = "../datos/iniciativas.json";
const RUTA_COMPETENCIAS = "../datos/competencias.json";
const SOLICITANTE_ACTUAL = "Jorge García"; // debe coincidir con el nombre en usuarios.json

const porId = (id) => document.getElementById(id);

let iniciativaActual = null;

// Regla de cada campo: recibe el valor y devuelve un mensaje de error o ""
const reglasSolicitud = {
  mensaje: (v) => validarRequerido(v, "El mensaje") || validarLongitud(v, 20, 500, "El mensaje"),
  competencia: (v) => validarSeleccion(v, "Competencia principal"),
  rol: (v) => validarSeleccion(v, "Rol deseado"),
  disponibilidad: (v) => validarSeleccion(v, "Disponibilidad")
};

function mostrarErrorPagina(mensaje) {
  porId("estadoCarga").hidden = true;
  porId("contenido").hidden = true;
  const error = porId("estadoError");
  error.textContent = mensaje;
  error.hidden = false;
}

function mostrarErrorCampo(idError, mensaje, campo) {
  const aviso = porId(idError);
  aviso.textContent = mensaje;
  aviso.hidden = mensaje === "";
  campo.setAttribute("aria-invalid", mensaje ? "true" : "false");
}

function validarCampo(id) {
  const campo = porId(id);
  const mensaje = reglasSolicitud[id](campo.value);
  mostrarErrorCampo(`error-${id}`, mensaje, campo);
  return mensaje === "";
}

function validarFormulario() {
  return Object.keys(reglasSolicitud).map(validarCampo).every(Boolean);
}

function avisar(mensaje) {
  const aviso = porId("estadoSolicitud");
  aviso.textContent = mensaje;
  aviso.hidden = mensaje === "";
}

// Si hay cambios guardados en localStorage, esos mandan; si no, el JSON.
async function obtenerIniciativas() {
  const guardadas = leerIniciativas();
  if (guardadas) return guardadas;

  const resultado = await cargarDatos(RUTA_INICIATIVAS);
  return resultado.estado === "error" ? null : resultado.datos;
}

function llenarSelect(select, opciones) {
  const nuevas = opciones.map((texto) => {
    const option = document.createElement("option");
    option.value = texto;
    option.textContent = texto;
    return option;
  });
  select.append(...nuevas);
}

function enviarSolicitud() {
  const formulario = porId("formSolicitud");

  if (!validarFormulario()) {
    avisar("Revisa los campos marcados antes de continuar.");
    const primerError = formulario.querySelector("[aria-invalid='true']");
    if (primerError) primerError.focus();
    return;
  }

  if (iniciativaActual.equipo.some((m) => m.nombre === SOLICITANTE_ACTUAL)) {
    avisar("Ya eres parte del equipo de esta iniciativa.");
    return;
  }

  const solicitudes = leerSolicitudes();
  const repetida = solicitudes.some(
    (s) => s.iniciativaId === iniciativaActual.id && s.solicitante === SOLICITANTE_ACTUAL
  );
  if (repetida) {
    avisar("Ya enviaste una solicitud a esta iniciativa.");
    return;
  }

  const nuevoId = solicitudes.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  solicitudes.push({
    id: nuevoId,
    iniciativaId: iniciativaActual.id,
    tituloIniciativa: iniciativaActual.titulo,
    solicitante: SOLICITANTE_ACTUAL,
    mensaje: porId("mensaje").value.trim(),
    competencia: porId("competencia").value,
    rol: porId("rol").value,
    disponibilidad: porId("disponibilidad").value,
    fecha: new Date().toLocaleDateString("en-CA"), // AAAA-MM-DD
    estado: "Pendiente"
  });
  guardarSolicitudes(solicitudes);

  avisar("");
  formulario.hidden = true;
  porId("textoConfirmacion").textContent =
    `Tu solicitud para "${iniciativaActual.titulo}" quedó registrada como pendiente.`;
  porId("confirmacion").hidden = false;
}

async function iniciarSolicitud() {
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  if (!id) {
    mostrarErrorPagina("No se indicó a qué iniciativa quieres solicitar participación.");
    return;
  }

  const iniciativas = await obtenerIniciativas();
  if (!iniciativas) {
    mostrarErrorPagina("No se pudieron cargar los datos. Intenta de nuevo más tarde.");
    return;
  }

  iniciativaActual = iniciativas.find((i) => i.id === id);
  if (!iniciativaActual) {
    mostrarErrorPagina("La iniciativa que buscas no existe.");
    return;
  }

  const competencias = await cargarDatos(RUTA_COMPETENCIAS);
  if (competencias.estado === "error") {
    mostrarErrorPagina("No se pudo cargar la lista de competencias. Intenta de nuevo más tarde.");
    return;
  }
  llenarSelect(porId("competencia"), competencias.datos);

  document.title = `Solicitar participación en ${iniciativaActual.titulo} — Innovation Hub`;
  porId("tituloIniciativa").textContent = iniciativaActual.titulo;
  porId("enlaceVolver").href = `detalle.html?id=${iniciativaActual.id}`;
  porId("enlaceDetalle").href = `detalle.html?id=${iniciativaActual.id}`;

  const formulario = porId("formSolicitud");

  // Al salir de un campo se valida solo ese campo
  formulario.addEventListener("focusout", (evento) => {
    if (reglasSolicitud[evento.target.id]) validarCampo(evento.target.id);
  });

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    enviarSolicitud();
  });

  porId("estadoCarga").hidden = true;
  porId("contenido").hidden = false;
}

iniciarSolicitud();