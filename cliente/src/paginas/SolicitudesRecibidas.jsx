import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { useCatalogos } from '../contexto/useCatalogos.js'
import { listarSolicitudes, cambiarEstadoSolicitud } from '../servicios/solicitudes.js'
import { estadosSolicitud } from '../servicios/participacion/validacion.js'
import useConsulta from '../hooks/useConsulta.js'
import useOperacion from '../hooks/useOperacion.js'
import EstadoConsulta from '../componentes/participacion/EstadoConsulta.jsx'
import Paginacion from '../componentes/participacion/Paginacion.jsx'
import ErrorOperacion from '../componentes/participacion/ErrorOperacion.jsx'
import SelectorIniciativa from '../componentes/participacion/SelectorIniciativa.jsx'

export default function SolicitudesRecibidas({ usuario }) {
  const { competencias } = useCatalogos()
  const [filtros, setFiltros] = useState({ skill: '', role: '', date: '' })
  const [borrador, setBorrador] = useState({ skill: '', role: '', date: '' })
  const [estado, setEstado] = useState('')
  const [iniciativaId, setIniciativaId] = useState('')
  const [pagina, setPagina] = useState(1)
  const [aviso, setAviso] = useState('')
  const operacion = useOperacion()
  const cargar = useCallback(signal => listarSolicitudes({ ...filtros, scope: 'received', status: estado, initiativeId: iniciativaId, page: pagina, size: 5 }, { usuario, signal }), [usuario, estado, iniciativaId, pagina, filtros])
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
      <form className="row g-2 mt-2" onSubmit={e => { e.preventDefault(); setFiltros({ ...borrador }); setPagina(1) }}>
        <div className="col-md-4"><label htmlFor="recibidas-skill" className="form-label">Competencia</label>
          <select id="recibidas-skill" className="form-select" value={borrador.skill} onChange={e => setBorrador(a => ({ ...a, skill: e.target.value }))}>
            <option value="">Todas</option>{competencias.map(c => <option key={c}>{c}</option>)}
          </select></div>
        <div className="col-md-4"><label htmlFor="recibidas-role" className="form-label">Rol solicitado</label>
          <input id="recibidas-role" className="form-control" maxLength={100} value={borrador.role} onChange={e => setBorrador(a => ({ ...a, role: e.target.value }))} /></div>
        <div className="col-md-4"><label htmlFor="recibidas-date" className="form-label">Fecha de solicitud</label>
          <input id="recibidas-date" type="date" className="form-control" value={borrador.date} onChange={e => setBorrador(a => ({ ...a, date: e.target.value }))} /></div>
        <div><button className="btn btn-outline-primary" type="submit">Aplicar filtros adicionales</button></div>
      </form>
    </fieldset>
    {aviso && <p className="alert alert-success" role="status">{aviso}</p>}
    <ErrorOperacion error={operacion.error} />
    <EstadoConsulta consulta={consulta}>{datos => <>
      {!datos.items.length && <p role="status">No hay solicitudes que coincidan con los filtros.</p>}
      <div className="vstack gap-3">{datos.items.map(s => <article key={s.id} className="card card-body">
        <h2 className="h5">{s.solicitanteNombre} · {s.iniciativa.titulo}</h2>
        <p><span className="badge text-bg-secondary">{s.estado}</span></p>
        <p style={{ whiteSpace: 'pre-wrap' }}>{s.mensaje}</p>
        <p>Rol solicitado: {s.rolSolicitado || "Colaborador"}</p>
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
