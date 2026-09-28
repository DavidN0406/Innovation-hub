// Pantalla de registro. Llena los selectores desde JSON con cargarDatos (datos.js).
const RUTA_CATEGORIAS = "../datos/categorias.json";
const RUTA_COMPETENCIAS = "../datos/competencias.json";

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

function iniciarRegistro() {
  cargarSelectores();

  // Por ahora el formulario solo se muestra: guardar y validar llegan en commits posteriores.
  document.querySelector("[data-form-registro]").addEventListener("submit", (evento) => {
    evento.preventDefault();
  });
}

iniciarRegistro();