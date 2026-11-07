import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { listarSolicitudes, cambiarEstadoSolicitud } from '../servicios/solicitudes.js'
import { estadosSolicitud } from '../servicios/participacion/validacion.js'
import useConsulta from '../hooks/useConsulta.js'
import useOperacion from '../hooks/useOperacion.js'
import EstadoConsulta from '../componentes/participacion/EstadoConsulta.jsx'
import Paginacion from '../componentes/participacion/Paginacion.jsx'
import ErrorOperacion from '../componentes/participacion/ErrorOperacion.jsx'
import SelectorIniciativa from '../componentes/participacion/SelectorIniciativa.jsx'

export default function SolicitudesRecibidas({ usuario }) {
  const [estado, setEstado] = useState('')
  const [iniciativaId, setIniciativaId] = useState('')
  const [pagina, setPagina] = useState(1)
  const [aviso, setAviso] = useState('')
  const operacion = useOperacion()
  const cargar = useCallback(signal => listarSolicitudes({ scope: 'received', status: estado, initiativeId: iniciativaId, page: pagina, size: 5 }, { usuario, signal }), [usuario, estado, iniciativaId, pagina])
  const consulta = useConsulta(cargar)
  function resolver(s, nuevoEstado) {
    if (!window.confirm(`¿Marcar la solicitud de ${s.solicitanteNombre} como ${nuevoEstado}?`)) return
    operacion.ejecutar(signal => cambiarEstadoSolicitud(s.id, nuevoEstado, { usuario, signal }), () => {
      setAviso(nuevoEstado === 'aceptada' ? 'Solicitud aceptada. El solicitante ya forma parte del equipo.' : 'Solicitud rechazada.')
      consulta.recargar()
    })
  }
  return <section><h1>Solicitudes recibidas</h1>
    <p>Solicitudes de las iniciativas que le pertenecen.</p>
    <fieldset disabled={operacion.ocupado} className="card card-body mb-3">
      <legend className="h5">Filtros</legend>
      <SelectorIniciativa usuario={usuario} valor={iniciativaId} todas onCambiar={valor => { setIniciativaId(valor); setPagina(1) }} />
      <label htmlFor="estado-recibidas" className="form-label">Estado</label>
      <select id="estado-recibidas" className="form-select" value={estado} onChange={e => { setEstado(e.target.value); setPagina(1) }}>
        <option value="">Todos los estados</option>{estadosSolicitud.map(e => <option key={e} value={e}>{e}</option>)}
      </select>
    </fieldset>
    {aviso && <p className="alert alert-success" role="status">{aviso}</p>}
    <ErrorOperacion error={operacion.error} />
    <EstadoConsulta consulta={consulta}>{datos => <>
      {!datos.items.length && <p role="status">No hay solicitudes que coincidan con los filtros.</p>}
      <div className="vstack gap-3">{datos.items.map(s => <article key={s.id} className="card card-body">
        <h2 className="h5">{s.solicitanteNombre} · {s.iniciativa.titulo}</h2>
        <p><span className="badge text-bg-secondary">{s.estado}</span></p>
        <p style={{ whiteSpace: 'pre-wrap' }}>{s.mensaje}</p>
        <p>Competencias: {s.competencias.join(', ')}</p><p>Disponibilidad: {s.disponibilidad}</p>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {s.estado === 'pendiente' && <><button className="btn btn-primary" disabled={operacion.ocupado} onClick={() => resolver(s, 'aceptada')}>Aceptar</button>
            <button className="btn btn-outline-danger" disabled={operacion.ocupado} onClick={() => resolver(s, 'rechazada')}>Rechazar</button></>}
          <Link to={`/iniciativas/${s.iniciativaId}/equipo`}>Ver equipo</Link>
        </div>
      </article>)}</div>
      <Paginacion datos={datos} onCambiar={setPagina} />
    </>}</EstadoConsulta>
  </section>
}
