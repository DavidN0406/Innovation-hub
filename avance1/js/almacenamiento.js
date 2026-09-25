// Para guardar cambios entre recargas.
// No es el mecanismo principal de datos, solo conserva ediciones locales.

const CLAVE_INICIATIVAS = "innovationhub_iniciativas";

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