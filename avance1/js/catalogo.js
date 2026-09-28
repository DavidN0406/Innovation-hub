// Genera las tarjetas del catalogo a partir de los datos, llena los filtros y permite eliminar con confirmación.
const RUTA_INICIATIVAS = "../datos/iniciativas.json";

let todasLasIniciativas = [];
let idPorEliminar = null;

function crearElemento(etiqueta, texto) {
  const elemento = document.createElement(etiqueta);
  elemento.textContent = texto;
  return elemento;
}

// Se construye con textContent (no innerHTML) porque ahora hay datos escritos por el usuario.
function crearTarjeta(iniciativa) {
  const columna = document.createElement("div");
  columna.className = "col-12 col-md-6 col-xl-4";

  const articulo = document.createElement("article");
  articulo.className = "card h-100 tarjeta-iniciativa";

  const cuerpo = document.createElement("div");
  cuerpo.className = "card-body";

  const insignias = document.createElement("p");
  insignias.className = "mb-2";
  const insigniaTipo = crearElemento("span", iniciativa.tipo);
  insigniaTipo.className = "badge text-bg-primary me-1";
  const insigniaEstado = crearElemento("span", iniciativa.estado);
  insigniaEstado.className = "badge text-bg-secondary";
  insignias.append(insigniaTipo, insigniaEstado);

  const titulo = crearElemento("h3", iniciativa.titulo);
  titulo.className = "h5 card-title";

  const categoria = crearElemento("p", iniciativa.categoria);
  categoria.className = "small text-body-secondary mb-2";

  const resumen = crearElemento("p", iniciativa.resumen);
  resumen.className = "card-text";

  const autor = document.createElement("p");
  autor.className = "small mb-3";
  autor.append("Publicado por ");
  autor.appendChild(crearElemento("strong", iniciativa.autor));

  const tituloCompetencias = crearElemento("h4", "Competencias requeridas");
  tituloCompetencias.className = "h6";

  const lista = document.createElement("ul");
  lista.className = "list-unstyled d-flex flex-wrap gap-1 mb-0";
  iniciativa.competencias.forEach((c) => {
    const item = crearElemento("li", c);
    item.className = "badge text-bg-light border";
    lista.appendChild(item);
  });

  cuerpo.append(insignias, titulo, categoria, resumen, autor, tituloCompetencias, lista);

  const pie = document.createElement("div");
  pie.className = "card-footer d-flex flex-wrap gap-2";

  const enlaceDetalle = crearElemento("a", "Ver detalle");
  enlaceDetalle.className = "btn btn-primary btn-sm";
  enlaceDetalle.href = `detalle.html?id=${iniciativa.id}`;
  enlaceDetalle.setAttribute("aria-label", `Ver detalle de ${iniciativa.titulo}`);

  const enlaceModificar = crearElemento("a", "Modificar");
  enlaceModificar.className = "btn btn-outline-secondary btn-sm";
  enlaceModificar.href = `registro.html?editar=${iniciativa.id}`;
  enlaceModificar.setAttribute("aria-label", `Modificar ${iniciativa.titulo}`);

  const botonEliminar = crearElemento("button", "Eliminar");
  botonEliminar.type = "button";
  botonEliminar.className = "btn btn-outline-danger btn-sm";
  botonEliminar.dataset.eliminar = iniciativa.id;
  botonEliminar.setAttribute("aria-label", `Eliminar ${iniciativa.titulo}`);

  pie.append(enlaceDetalle, enlaceModificar, botonEliminar);

  articulo.append(cuerpo, pie);
  columna.appendChild(articulo);
  return columna;
}


function pintarIniciativas(lista) {
  const contenedor = document.querySelector("[data-lista-iniciativas]");
  const titulo = document.querySelector("[data-titulo-resultados]");

  contenedor.replaceChildren();

  if (lista.length === 0) {
    titulo.textContent = "No se encontraron iniciativas";
    return;
  }

  titulo.textContent = `${lista.length} iniciativas encontradas`;
  lista.forEach((iniciativa) => {
    contenedor.appendChild(crearTarjeta(iniciativa));
  });
}

function llenarSelect(select, opciones) {
  opciones.forEach((opcion) => {
    const elemento = document.createElement("option");
    elemento.value = opcion;
    elemento.textContent = opcion;
    select.appendChild(elemento);
  });
}

function aplicarFiltros() {
  const formulario = document.querySelector("[data-form-filtros]");

  const texto = formulario.elements["texto"].value.trim().toLowerCase();
  const tipo = formulario.elements["tipo"].value;
  const categoria = formulario.elements["categoria"].value;
  const competencia = formulario.elements["competencia"].value;

  const resultado = todasLasIniciativas.filter((iniciativa) => {
    const coincideTexto =
      texto === "" ||
      iniciativa.titulo.toLowerCase().includes(texto) ||
      iniciativa.resumen.toLowerCase().includes(texto);

    const coincideTipo = tipo === "" || iniciativa.tipo === tipo;
    const coincideCategoria = categoria === "" || iniciativa.categoria === categoria;
    const coincideCompetencia =
      competencia === "" || iniciativa.competencias.includes(competencia);

    return coincideTexto && coincideTipo && coincideCategoria && coincideCompetencia;
  });

  pintarIniciativas(resultado);
}

// --- Eliminar con confirmación ---

function abrirModalEliminar(id) {
  const iniciativa = todasLasIniciativas.find((i) => i.id === id);
  if (!iniciativa) return;

  idPorEliminar = id;
  document.querySelector("[data-texto-modal]").textContent =
    `¿Seguro que quieres eliminar "${iniciativa.titulo}"? Esta acción no se puede deshacer.`;
  document.querySelector("[data-modal-eliminar]").showModal();
}

function cerrarModalEliminar() {
  document.querySelector("[data-modal-eliminar]").close();
  idPorEliminar = null;
}

function confirmarEliminar() {
  if (idPorEliminar === null) return;

  const eliminada = todasLasIniciativas.find((i) => i.id === idPorEliminar);
  todasLasIniciativas = todasLasIniciativas.filter((i) => i.id !== idPorEliminar);
  guardarIniciativas(todasLasIniciativas);
  cerrarModalEliminar();
  aplicarFiltros();

  const aviso = document.querySelector("[data-aviso-catalogo]");
  aviso.textContent = `Se eliminó la iniciativa "${eliminada.titulo}".`;
}

// --- Inicio ---

async function iniciarCatalogo() {
  const titulo = document.querySelector("[data-titulo-resultados]");

  // Si hay cambios guardados en localStorage, esos mandan; si no, el JSON.
  let lista = leerIniciativas();
  if (!lista) {
    const resultado = await cargarDatos(RUTA_INICIATIVAS);
    if (resultado.estado === "error") {
      titulo.textContent = "No se pudieron cargar las iniciativas";
      return;
    }
    lista = resultado.datos;
  }

  todasLasIniciativas = lista;

  if (todasLasIniciativas.length === 0) {
    titulo.textContent = "Todavía no hay iniciativas registradas";
  } else {
    pintarIniciativas(todasLasIniciativas);
  }

  const formulario = document.querySelector("[data-form-filtros]");
  formulario.addEventListener("input", aplicarFiltros);
  formulario.addEventListener("submit", (evento) => evento.preventDefault());

  // Delegación: un solo escucha para todos los botones "Eliminar"
  document.querySelector("[data-lista-iniciativas]").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-eliminar]");
    if (boton) abrirModalEliminar(Number(boton.dataset.eliminar));
  });

  document.querySelector("[data-confirmar-eliminar]").addEventListener("click", confirmarEliminar);
  document.querySelector("[data-cancelar-eliminar]").addEventListener("click", cerrarModalEliminar);

  const categorias = await cargarDatos("../datos/categorias.json");
  if (categorias.estado === "listo") {
    llenarSelect(document.querySelector("[data-select-categorias]"), categorias.datos);
  }

  const competencias = await cargarDatos("../datos/competencias.json");
  if (competencias.estado === "listo") {
    llenarSelect(document.querySelector("[data-select-competencias]"), competencias.datos);
  }
}

document.addEventListener("DOMContentLoaded", iniciarCatalogo);