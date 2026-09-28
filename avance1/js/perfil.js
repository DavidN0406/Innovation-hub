// Pantalla de perfil. Usa cargarDatos (datos.js) y leerIniciativas (almacenamiento.js).
const RUTA_USUARIOS = "../datos/usuarios.json";
const RUTA_INICIATIVAS = "../datos/iniciativas.json";
const ID_USUARIO_ACTUAL = 1; // Sin login: el usuario actual es el primero de usuarios.json

const porId = (id) => document.getElementById(id);

function mostrarError(mensaje) {
  porId("estadoCarga").hidden = true;
  porId("contenido").hidden = true;
  const error = porId("estadoError");
  error.textContent = mensaje;
  error.hidden = false;
}

function llenarLista(idLista, textos, clase) {
  const items = textos.map((texto) => {
    const li = document.createElement("li");
    li.className = clase;
    li.textContent = texto;
    return li;
  });
  porId(idLista).replaceChildren(...items);
}

// Si hay cambios guardados en localStorage, esos mandan; si no, el JSON.
async function obtenerIniciativas() {
  const guardadas = leerIniciativas();
  if (guardadas) return guardadas;

  const resultado = await cargarDatos(RUTA_INICIATIVAS);
  return resultado.estado === "error" ? null : resultado.datos;
}

function pintarProyectos(usuario, iniciativas) {
  // Participa en una iniciativa si su nombre aparece en el equipo
  const participaciones = iniciativas
    .map((ini) => ({ ini, miembro: ini.equipo.find((m) => m.nombre === usuario.nombre) }))
    .filter((p) => p.miembro);

  porId("sinProyectos").hidden = participaciones.length > 0;

  const items = participaciones.map(({ ini, miembro }) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    const enlace = document.createElement("a");
    enlace.href = `detalle.html?id=${ini.id}`;
    enlace.textContent = ini.titulo;
    li.append(enlace, ` - ${miembro.rol} · ${ini.estado}`);
    return li;
  });
  porId("proyectos").replaceChildren(...items);
}

function pintarPerfil(usuario, iniciativas) {
  porId("nombre").textContent = usuario.nombre;
  const correo = porId("correo");
  correo.textContent = usuario.correo;
  correo.href = `mailto:${usuario.correo}`;
  porId("rol").textContent = usuario.rol;

  llenarLista("competencias", usuario.competencias, "badge text-bg-primary");
  llenarLista("intereses", usuario.intereses, "badge text-bg-light border");
  pintarProyectos(usuario, iniciativas);

  porId("estadoCarga").hidden = true;
  porId("contenido").hidden = false;
}

async function iniciarPerfil() {
  const usuarios = await cargarDatos(RUTA_USUARIOS);
  if (usuarios.estado === "error") {
    mostrarError("No se pudo cargar el perfil. Intentá de nuevo más tarde.");
    return;
  }

  const usuario = usuarios.datos.find((u) => u.id === ID_USUARIO_ACTUAL);
  if (!usuario) {
    mostrarError("No se encontró el usuario.");
    return;
  }

  const iniciativas = await obtenerIniciativas();
  if (!iniciativas) {
    mostrarError("No se pudieron cargar los proyectos. Intentá de nuevo más tarde.");
    return;
  }

  pintarPerfil(usuario, iniciativas);
}

iniciarPerfil();