export default function Paginacion({ datos, onCambiar }) {
  return <nav className="d-flex align-items-center gap-3 my-3" aria-label="Paginación">
    <button className="btn btn-outline-secondary" disabled={datos.page <= 1} onClick={() => onCambiar(datos.page - 1)}>Anterior</button>
    <span>Página {datos.page} de {datos.totalPages} · {datos.total} resultados</span>
    <button className="btn btn-outline-secondary" disabled={datos.page >= datos.totalPages} onClick={() => onCambiar(datos.page + 1)}>Siguiente</button>
  </nav>
}
