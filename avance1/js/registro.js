// Pantalla de registro y edición: selectores desde JSON, competencias dinámicas, validación por campo y guardado local.
const RUTA_CATEGORIAS = "../datos/categorias.json";
const RUTA_COMPETENCIAS = "../datos/competencias.json";
const RUTA_INICIATIVAS = "../datos/iniciativas.json";
const AUTOR_ACTUAL = "Jorge García"; // debe coincidir con el nombre en usuarios.json

// Si la URL trae ?editar=ID, el formulario modifica esa iniciativa en vez de crear una nueva
const parametroEditar = new URLSearchParams(window.location.search).get("editar");
const idEdicion = parametroEditar ? Number(parametroEditar) : null;

// Competencias elegidas en esta sesión del formulario
let competenciasElegidas = [];

// Regla de cada campo: recibe el valor y devuelve un mensaje de error o ""
const reglasRegistro = {
  titulo: (v) => validarRequerido(v, "El título") || validarLongitud(v, 5, 80, "El título"),
  tipo: (v) => validarSeleccion(v, "Tipo"),
  categoria: (v) => validarSeleccion(v, "Categoría"),
  resumen: (v) => validarRequerido(v, "El resumen") || validarLongitud(v, 20, 200, "El resumen"),
  descripcion: (v) => validarRequerido(v, "La descripción") || validarLongitud(v, 30, 1000, "La descripción"),
  problema: (v) => validarRequerido(v, "El problema identificado") || validarLongitud(v, 15, 500, "El problema identificado"),
  beneficiarios: (v) => validarRequerido(v, "Los beneficiarios") || validarLongitud(v, 3, 150, "Los beneficiarios"),
  participantes: (v) => validarEnteroEnRango(v, 1, 50, "La cantidad de participantes"),
  visibilidad: (v) => validarSeleccion(v, "Nivel de visibilidad"),
  etiquetas: (v) => validarEtiquetas(v, 5, 20)
};

function mostrarErrorCampo(idError, mensaje, campo) {
  const aviso = document.getElementById(idError);
  aviso.textContent = mensaje;
  aviso.hidden = mensaje === "";
  if (campo) campo.setAttribute("aria-invalid", mensaje ? "true" : "false");
}

function validarCampo(id) {
  const campo = document.getElementById(id);
  const mensaje = reglasRegistro[id](campo.value);
  mostrarErrorCampo(`error-${id}`, mensaje, campo);
  return mensaje === "";
}

function validarCompetenciasElegidas() {
  const mensaje = competenciasElegidas.length === 0 ? "Agrega al menos una competencia." : "";
  mostrarErrorCampo("error-competencias", mensaje, document.getElementById("competencia"));
  return mensaje === "";
}

function validarFormularioCompleto() {
  const resultados = Object.keys(reglasRegistro).map(validarCampo);
  resultados.push(validarCompetenciasElegidas());
  return resultados.every(Boolean);
}

// --- Competencias dinámicas ---

function pintarCompetencias() {
  const lista = document.querySelector("[data-lista-competencias]");
  const items = competenciasElegidas.map((competencia) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.append(competencia);
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn btn-sm btn-outline-danger";
    boton.textContent = "Quitar";
    boton.dataset.quitar = competencia;
    boton.setAttribute("aria-label", `Quitar ${competencia}`);
    li.appendChild(boton);
    return li;
  });
  lista.replaceChildren(...items);
}

function agregarCompetencia() {
  const select = document.getElementById("competencia");
  const valor = select.value;

  if (valor === "") {
    mostrarErrorCampo("error-competencias", "Selecciona una competencia antes de agregarla.", select);
    return;
  }
  if (competenciasElegidas.includes(valor)) {
    mostrarErrorCampo("error-competencias", "Esa competencia ya está en la lista.", select);
    return;
  }

  competenciasElegidas.push(valor);
  select.value = "";
  mostrarErrorCampo("error-competencias", "", select);
  pintarCompetencias();
}

function quitarCompetencia(competencia) {
  competenciasElegidas = competenciasElegidas.filter((c) => c !== competencia);
  pintarCompetencias();
}

// --- Carga de selectores ---

function llenarSelect(select, opciones) {
  const nuevas = opciones.map((texto) => {
    const option = document.createElement("option");
    option.value = texto;
    option.textContent = texto;
    return option;
  });
  select.append(...nuevas);
}

function avisarProblemaRegistro(mensaje) {
  const aviso = document.getElementById("estadoFormulario");
  aviso.textContent = mensaje;
  aviso.hidden = false;
}

async function cargarSelectores() {
  const selectCategorias = document.querySelector("[data-select-categorias]");
  const selectCompetencias = document.querySelector("[data-select-competencias]");

  const [categorias, competencias] = await Promise.all([
    cargarDatos(RUTA_CATEGORIAS),
    cargarDatos(RUTA_COMPETENCIAS)
  ]);

  if (categorias.estado === "error" || competencias.estado === "error") {
    avisarProblemaRegistro("No se pudieron cargar las categorías o competencias. Intentá de nuevo más tarde.");
    return;
  }

  llenarSelect(selectCategorias, categorias.datos);
  llenarSelect(selectCompetencias, competencias.datos);
}

// --- Datos guardados ---

// Base: lo guardado en localStorage, o el JSON si todavía no hay nada guardado
async function obtenerLista() {
  const guardada = leerIniciativas();
  if (guardada) return guardada;

  const resultado = await cargarDatos(RUTA_INICIATIVAS);
  return resultado.estado === "error" ? null : resultado.datos;
}

async function guardarIniciativa() {
  const lista = await obtenerLista();
  if (!lista) return false;

  const valor = (id) => document.getElementById(id).value.trim();
  const datos = {
    titulo: valor("titulo"),
    tipo: valor("tipo"),
    resumen: valor("resumen"),
    descripcion: valor("descripcion"),
    problema: valor("problema"),
    beneficiarios: valor("beneficiarios"),
    categoria: valor("categoria"),
    competencias: [...competenciasElegidas],
    participantesEstimados: Number(valor("participantes")),
    visibilidad: valor("visibilidad"),
    etiquetas: valor("etiquetas").split(",").map((e) => e.trim()).filter(Boolean)
  };

  if (idEdicion !== null) {
    // Modificar: se conservan id, autor, fecha, estado y equipo
    const indice = lista.findIndex((i) => i.id === idEdicion);
    if (indice === -1) return false;
    lista[indice] = { ...lista[indice], ...datos };
  } else {
    const nuevoId = lista.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    lista.push({
      id: nuevoId,
      ...datos,
      autor: AUTOR_ACTUAL,
      fechaPublicacion: new Date().toLocaleDateString("en-CA"), // AAAA-MM-DD
      estado: "Abierta",
      equipo: [{ nombre: AUTOR_ACTUAL, rol: "Líder de proyecto" }]
    });
  }

  guardarIniciativas(lista);
  return true;
}

// --- Modo edición ---

function rellenarFormulario(iniciativa) {
  const poner = (id, valor) => { document.getElementById(id).value = valor; };
  poner("titulo", iniciativa.titulo);
  poner("tipo", iniciativa.tipo);
  poner("categoria", iniciativa.categoria);
  poner("resumen", iniciativa.resumen);
  poner("descripcion", iniciativa.descripcion);
  poner("problema", iniciativa.problema);
  poner("beneficiarios", iniciativa.beneficiarios);
  poner("participantes", iniciativa.participantesEstimados);
  poner("visibilidad", iniciativa.visibilidad);
  poner("etiquetas", (iniciativa.etiquetas || []).join(", "));

  competenciasElegidas = [...iniciativa.competencias];
  pintarCompetencias();
}

async function prepararEdicion() {
  if (idEdicion === null) return;

  const lista = await obtenerLista();
  const iniciativa = lista ? lista.find((i) => i.id === idEdicion) : null;

  if (!iniciativa) {
    avisarProblemaRegistro("No se encontró la iniciativa que querés modificar.");
    document.querySelector("[data-form-registro]").hidden = true;
    return;
  }

  document.title = "Modificar iniciativa - Innovation Hub";
  document.querySelector("h1").textContent = "Modificar iniciativa";
  document.querySelector("[data-form-registro] [type='submit']").textContent = "Guardar cambios";
  rellenarFormulario(iniciativa);
}

// --- Eventos (un solo escucha por tipo, con delegación) ---

function iniciarRegistro() {
  const formulario = document.querySelector("[data-form-registro]");

  formulario.addEventListener("click", (evento) => {
    if (evento.target.matches("[data-agregar-competencia]")) {
      agregarCompetencia();
    }
    if (evento.target.matches("[data-quitar]")) {
      quitarCompetencia(evento.target.dataset.quitar);
    }
  });

  // Al salir de un campo se valida solo ese campo
  formulario.addEventListener("focusout", (evento) => {
    if (reglasRegistro[evento.target.id]) validarCampo(evento.target.id);
  });

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const aviso = document.getElementById("estadoFormulario");

    if (!validarFormularioCompleto()) {
      aviso.textContent = "Revisa los campos marcados antes de continuar.";
      aviso.hidden = false;
      const primerError = formulario.querySelector("[aria-invalid='true']");
      if (primerError) primerError.focus();
      return;
    }

    const guardada = await guardarIniciativa();
    if (!guardada) {
      aviso.textContent = "No se pudo guardar la iniciativa. Intenta de nuevo.";
      aviso.hidden = false;
      return;
    }

    if (idEdicion !== null) {
      // Al terminar de modificar se vuelve al catálogo, que ya muestra el cambio
      window.location.href = "catalogo.html";
      return;
    }

    formulario.reset();
    competenciasElegidas = [];
    pintarCompetencias();
    formulario.querySelectorAll("[aria-invalid]").forEach((c) => c.removeAttribute("aria-invalid"));
    aviso.textContent = "Iniciativa registrada. Ya puedes verla en el catálogo.";
    aviso.hidden = false;
  });

  // Primero se llenan los selectores; después, si es edición, se cargan los datos
  cargarSelectores().then(prepararEdicion);
}

iniciarRegistro();