// Genera la barra de navegacion de Bootstrap en cada pantalla a partir de un solo arreglo de enlaces.

const enlacesNav = [
  { texto: "Catálogo", href: "catalogo.html" },
  { texto: "Registrar iniciativa", href: "registro.html" },
  { texto: "Mi perfil", href: "perfil.html" }
];

function inicializarNav() {
  const cabecera = document.querySelector("header");
  const nav = document.querySelector("[data-nav]");
  if (!cabecera || !nav) return;

  const rutaActual = window.location.pathname.split("/").pop();
  // Desde index.html (raíz de avance1) las páginas están en paginas/, desde paginas/ no hace falta prefijo.
  const enPaginas = window.location.pathname.includes("/paginas/");
  const prefijo = enPaginas ? "" : "paginas/";
  const inicio = enPaginas ? "../index.html" : "index.html";

  // La marca de la navbar reemplaza el enlace suelto que traían las páginas
  cabecera.querySelectorAll(":scope > a").forEach((enlace) => enlace.remove());

  const contenedor = document.createElement("div");
  contenedor.className = "container";

  const marca = document.createElement("a");
  marca.className = "navbar-brand";
  marca.href = inicio;
  marca.textContent = "Innovation Hub";

  const boton = document.createElement("button");
  boton.className = "navbar-toggler";
  boton.type = "button";
  boton.dataset.bsToggle = "collapse";
  boton.dataset.bsTarget = "#menu-principal";
  boton.setAttribute("aria-controls", "menu-principal");
  boton.setAttribute("aria-expanded", "false");
  boton.setAttribute("aria-label", "Mostrar u ocultar el menú");
  const icono = document.createElement("span");
  icono.className = "navbar-toggler-icon";
  boton.appendChild(icono);

  const colapsable = document.createElement("div");
  colapsable.className = "collapse navbar-collapse";
  colapsable.id = "menu-principal";

  const lista = document.createElement("ul");
  lista.className = "navbar-nav ms-auto";

  enlacesNav.forEach((enlace) => {
    const item = document.createElement("li");
    item.className = "nav-item";

    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = prefijo + enlace.href;
    link.textContent = enlace.texto;

    if (enlace.href === rutaActual) {
      link.setAttribute("aria-current", "page");
    }

    item.appendChild(link);
    lista.appendChild(item);
  });

  colapsable.appendChild(lista);
  contenedor.append(marca, boton, colapsable);

  nav.className = "navbar navbar-expand-md navbar-dark bg-primary";
  nav.replaceChildren(contenedor);

  // JavaScript de Bootstrap, necesario para que el menú se abra y cierre en pantallas pequeñas
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js";
  document.body.appendChild(script);
}

document.addEventListener("DOMContentLoaded", inicializarNav);