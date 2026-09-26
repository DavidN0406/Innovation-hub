// Genera las tarjetas del catalogo a partir de los datos, y llena los filtros.

let todasLasIniciativas = [];

function crearTarjeta(iniciativa) {
  const articulo = document.createElement("article");
  articulo.classList.add("tarjeta-iniciativa");

  articulo.innerHTML = `
    <h3>${iniciativa.titulo}</h3>
    <p>${iniciativa.tipo} · ${iniciativa.categoria}</p>
    <p>${iniciativa.resumen}</p>
    <p>Publicado por <strong>${iniciativa.autor}</strong></p>
    <h4>Competencias requeridas</h4>
    <ul>
      ${iniciativa.competencias.map((c) => `<li>${c}</li>`).join("")}
    </ul>
    <p>Estado: ${iniciativa.estado}</p>
    <p><a href="detalle.html?id=${iniciativa.id}">Ver la iniciativa ${iniciativa.titulo}</a></p>
  `;

  return articulo;
}

function pintarIniciativas(lista) {
  const contenedor = document.querySelector("[data-lista-iniciativas]");
  const titulo = document.querySelector("[data-titulo-resultados]");

  contenedor.innerHTML = "";

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

async function iniciarCatalogo() {
  const titulo = document.querySelector("[data-titulo-resultados]");
  const resultado = await cargarDatos("../datos/iniciativas.json");

  if (resultado.estado === "error") {
    titulo.textContent = "No se pudieron cargar las iniciativas";
    return;
  }

  if (resultado.estado === "vacio") {
    titulo.textContent = "Todavía no hay iniciativas registradas";
    return;
  }

  todasLasIniciativas = resultado.datos;
  pintarIniciativas(todasLasIniciativas);

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