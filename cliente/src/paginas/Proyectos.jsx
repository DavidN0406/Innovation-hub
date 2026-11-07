import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { listarProyectos } from '../servicios/proyectos.js'
import useConsulta from '../hooks/useConsulta.js'
import EstadoConsulta from '../componentes/participacion/EstadoConsulta.jsx'
import Paginacion from '../componentes/participacion/Paginacion.jsx'

export default function Proyectos({ usuario }) {
  const [pagina, setPagina] = useState(1)
  const cargar = useCallback(signal => listarProyectos({ page: pagina, size: 5 }, { usuario, signal }), [usuario, pagina])
  const consulta = useConsulta(cargar)
  return <section><h1>Proyectos accesibles</h1>
    <EstadoConsulta consulta={consulta}>{datos => <>
      {!datos.items.length && <p role="status">No hay proyectos accesibles en esta página.</p>}
      <div className="row g-3">{datos.items.map(p => <article key={p.id} className="col-12 col-md-6">
        <div className="card card-body h-100"><h2 className="h4"><Link to={`/proyectos/${encodeURIComponent(p.id)}`}>{p.nombre}</Link></h2>
          <p>{p.descripcion}</p><p>Estado: {p.estado}</p>
          <p className="mb-0">Iniciativa de origen: {p.iniciativa.titulo} (ID: {p.iniciativaId})</p>
        </div>
      </article>)}</div>
      <Paginacion datos={datos} onCambiar={setPagina} />
    </>}</EstadoConsulta>
  </section>
}
