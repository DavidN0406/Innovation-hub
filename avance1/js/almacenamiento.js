// Para guardar cambios entre recargas.
// No es el mecanismo principal de datos, solo conserva ediciones locales.

const CLAVE_INICIATIVAS = "innovationhub_iniciativas";
const CLAVE_SOLICITUDES = "innovationhub_solicitudes";

function guardarIniciativas(lista) {
  try {
    localStorage.setItem(CLAVE_INICIATIVAS, JSON.stringify(lista));
  } catch (error) {
    console.error("No se pudo guardar en localStorage:", error);
  }
}

function leerIniciativas() {
  try {
    const datos = localStorage.getItem(CLAVE_INICIATIVAS);
    return datos ? JSON.parse(datos) : null;
  } catch (error) {
    console.error("No se pudo leer localStorage:", error);
    return null;
  }
}

function guardarSolicitudes(lista) {
  try {
    localStorage.setItem(CLAVE_SOLICITUDES, JSON.stringify(lista));
  } catch (error) {
    console.error("No se pudo guardar en localStorage:", error);
  }
}

// Devuelve siempre un arreglo: vacío si todavía no hay solicitudes.
function leerSolicitudes() {
  try {
    const datos = localStorage.getItem(CLAVE_SOLICITUDES);
    return datos ? JSON.parse(datos) : [];
  } catch (error) {
    console.error("No se pudo leer localStorage:", error);
    return [];
  }
}