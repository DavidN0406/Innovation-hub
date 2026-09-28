// Genera la barra de navegacion en cada pantalla a partir de un solo arreglo de enlaces.

const enlacesNav = [
  { texto: "Catálogo", href: "catalogo.html" },
  { texto: "Registrar iniciativa", href: "registro.html" },
  { texto: "Mi perfil", href: "perfil.html" }
];

function inicializarNav() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;

  const rutaActual = window.location.pathname.split("/").pop();
  // Desde index.html (raíz de avance1) las páginas están en paginas/; desde paginas/ no hace falta prefijo.
  const prefijo = window.location.pathname.includes("/paginas/") ? "" : "paginas/";
  const lista = document.createElement("ul");

  enlacesNav.forEach((enlace) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = prefijo + enlace.href;
    link.textContent = enlace.texto;

    if (enlace.href === rutaActual) {
      link.setAttribute("aria-current", "page");
    }

    item.appendChild(link);
    lista.appendChild(item);
  });

  nav.appendChild(lista);
}

document.addEventListener("DOMContentLoaded", inicializarNav);