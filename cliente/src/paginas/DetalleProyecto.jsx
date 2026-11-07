import { useCallback } from 'react'
import { Link, useParams } from 'react-router'
import { consultarProyecto } from '../servicios/proyectos.js'
import useConsulta from '../hooks/useConsulta.js'
import EstadoConsulta from '../componentes/participacion/EstadoConsulta.jsx'

function Detalle({ id, usuario }) {
  const cargar = useCallback(signal => consultarProyecto(id, { usuario, signal }), [id, usuario])
  const consulta = useConsulta(cargar)
  return <section><h1>Detalle de proyecto</h1>
    <EstadoConsulta consulta={consulta}>{p => <article className="card card-body mb-3">
      <h2>{p.nombre}</h2>
      <dl>
        <dt>Descripción</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{p.descripcion}</dd>
        <dt>Objetivo</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{p.objetivo}</dd>
        <dt>Fecha de inicio</dt><dd><time dateTime={p.fechaInicio}>{p.fechaInicio}</time></dd>
        <dt>Estado</dt><dd>{p.estado}</dd>
        <dt>Iniciativa de origen</dt><dd>{p.iniciativa.titulo} (ID: {p.iniciativaId}) · <Link to={`/iniciativas/${encodeURIComponent(p.iniciativaId)}/equipo`}>Consultar equipo</Link></dd>
      </dl>
      {!p.repositorio && <p>Este proyecto no tiene un repositorio asociado.</p>}
      {p.repositorio && <p>Repositorio asociado: {p.repositorio}</p>}
    </article>}</EstadoConsulta>
    <Link to="/proyectos">Volver a proyectos</Link>
  </section>
}
export default function DetalleProyecto({ usuario }) {
  const { id } = useParams()
  return <Detalle key={`${id}-${usuario.id}`} id={id} usuario={usuario} />
}
