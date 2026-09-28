// Pantalla de detalle. Usa cargarDatos (datos.js) y leerIniciativas (almacenamiento.js).
const RUTA_INICIATIVAS = "../datos/iniciativas.json";

const porId = (id) => document.getElementById(id);

function mostrarError(mensaje) {
  porId("estadoCarga").hidden = true;
  porId("contenido").hidden = true;
  const error = porId("estadoError");
  error.textContent = mensaje;
  error.hidden = false;
}

function formatearFecha(iso) {
  // "T00:00:00" evita que la zona horaria reste un día
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", {
    year: "numeric", month: "long", day: "numeric"
  });
}

function llenarLista(idLista, textos) {
  const items = textos.map((texto) => {
    const li = document.createElement("li");
    li.textContent = texto;
    return li;
  });
  porId(idLista).replaceChildren(...items);
}

function pintarDetalle(ini) {
  // RN-03: una iniciativa restringida muestra solo el resumen
  const restringida = ini.visibilidad === "restringida";

  document.title = `${ini.titulo} — Innovation Hub`;
  porId("titulo").textContent = ini.titulo;
  porId("tipoCategoria").textContent = `${ini.tipo} · ${ini.categoria}`;
  porId("resumen").textContent = ini.resumen;
  porId("visibilidad").textContent = restringida ? "Restringida" : "Pública";

  const estado = porId("estado");
  estado.replaceChildren();
  const punto = document.createElement("span");
  punto.setAttribute("aria-hidden", "true");
  punto.textContent = "● ";
  estado.append(punto, ini.estado);

  porId("avisoRestringida").hidden = !restringida;
  porId("contenidoCompleto").hidden = restringida;

  if (!restringida) {
    porId("descripcion").textContent = ini.descripcion;
    porId("autor").textContent = ini.autor;
    const fecha = porId("fechaPublicacion");
    fecha.textContent = formatearFecha(ini.fechaPublicacion);
    fecha.dateTime = ini.fechaPublicacion;
    llenarLista("competencias", ini.competencias);
    llenarLista("equipo", ini.equipo.map((m) => `${m.nombre} — ${m.rol}`));
    porId("miembros").textContent =
      `${ini.equipo.length} de ${ini.participantesEstimados} miembros`;
  }

  // Enlace al formulario de solicitud (también en restringidas: así se pide acceso)
  porId("enlaceSolicitud").href = `solicitud.html?id=${ini.id}`;

  porId("estadoCarga").hidden = true;
  porId("contenido").hidden = false;
}

async function iniciarDetalle() {
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  if (!id) {
    mostrarError("No se indicó qué iniciativa mostrar.");
    return;
  }

  // Si hay cambios guardados en localStorage, esos mandan; si no, el JSON.
  let lista = leerIniciativas();
  if (!lista) {
    const resultado = await cargarDatos(RUTA_INICIATIVAS);
    if (resultado.estado === "error") {
      mostrarError("No se pudieron cargar los datos. Intenta de nuevo más tarde.");
      return;
    }
    lista = resultado.datos;
  }

  const ini = lista.find((i) => i.id === id);
  if (!ini) {
    mostrarError("La iniciativa que buscas no existe.");
    return;
  }
  pintarDetalle(ini);
}

iniciarDetalle();