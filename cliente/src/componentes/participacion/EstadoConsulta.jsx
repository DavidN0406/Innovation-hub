export default function EstadoConsulta({ consulta, children }) {
  if (consulta.cargando) return <p className="py-3" role="status">Cargando información…</p>
  if (consulta.error) return <div className="alert alert-danger" role="alert">
    <p>{consulta.error.message}</p>
    <button className="btn btn-outline-danger" onClick={consulta.recargar}>Reintentar</button>
  </div>
  if (consulta.datos == null) return <p role="status">No hay información disponible.</p>
  return children(consulta.datos)
}
