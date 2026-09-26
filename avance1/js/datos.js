// Carga un archivo JSON y devuelve su estado: listo, vacio o error.
async function cargarDatos(ruta) {
  try {
    const respuesta = await fetch(ruta);
    const datos = await respuesta.json();
    return { estado: datos.length ? "listo" : "vacio", datos };
  } catch (error) {
    console.error(`Error al cargar ${ruta}:`, error);
    return { estado: "error", datos: [] };
  }
}