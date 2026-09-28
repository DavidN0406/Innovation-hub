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
  const articulo = document.createElement("article");
  articulo.classList.add("tarjeta-iniciativa");

  articulo.appendChild(crearElemento("h3", iniciativa.titulo));
  articulo.appendChild(crearElemento("p", `${iniciativa.tipo} · ${iniciativa.categoria}`));
  articulo.appendChild(crearElemento("p", iniciativa.resumen));

  const autor = document.createElement("p");
  autor.append("Publicado por ");
  autor.appendChild(crearElemento("strong", iniciativa.autor));
  articulo.appendChild(autor);

  articulo.appendChild(crearElemento("h4", "Competencias requeridas"));
  const lista = document.createElement("ul");
  iniciativa.competencias.forEach((c) => lista.appendChild(crearElemento("li", c)));
  articulo.appendChild(lista);

  articulo.appendChild(crearElemento("p", `Estado: ${iniciativa.estado}`));

  const enlaceParrafo = document.createElement("p");
  const enlace = crearElemento("a", `Ver la iniciativa ${iniciativa.titulo}`);
  enlace.href = `detalle.html?id=${iniciativa.id}`;
  enlaceParrafo.appendChild(enlace);
  articulo.appendChild(enlaceParrafo);

  const acciones = document.createElement("p");
  const botonEliminar = crearElemento("button", "Eliminar");
  botonEliminar.type = "button";
  botonEliminar.dataset.eliminar = iniciativa.id;
  botonEliminar.setAttribute("aria-label", `Eliminar ${iniciativa.titulo}`);
  const enlaceModificar = crearElemento("a", "Modificar");
  enlaceModificar.href = `registro.html?editar=${iniciativa.id}`;
  enlaceModificar.setAttribute("aria-label", `Modificar ${iniciativa.titulo}`);
  acciones.append(enlaceModificar, " ", botonEliminar);
  articulo.appendChild(acciones);

  return articulo;
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