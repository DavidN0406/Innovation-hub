import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { listarSolicitudes, editarSolicitud, cambiarEstadoSolicitud } from '../servicios/solicitudes.js'
import useConsulta from '../hooks/useConsulta.js'
import useOperacion from '../hooks/useOperacion.js'
import EstadoConsulta from '../componentes/participacion/EstadoConsulta.jsx'
import Paginacion from '../componentes/participacion/Paginacion.jsx'
import ErrorOperacion from '../componentes/participacion/ErrorOperacion.jsx'
import FormularioSolicitud from '../componentes/participacion/FormularioSolicitud.jsx'

export default function MisSolicitudes({ usuario }) {
  const [pagina, setPagina] = useState(1)
  const [editando, setEditando] = useState(null)
  const [aviso, setAviso] = useState('')
  const operacion = useOperacion()
  const cargar = useCallback(signal => listarSolicitudes({ scope: 'mine', page: pagina, size: 5 }, { usuario, signal }), [usuario, pagina])
  const consulta = useConsulta(cargar)
  function actualizar(mensaje) { setEditando(null); setAviso(mensaje); consulta.recargar() }
  function cancelar(solicitud) {
    if (!window.confirm(`¿Cancelar su solicitud para «${solicitud.iniciativa.titulo}»?`)) return
    operacion.ejecutar(signal => cambiarEstadoSolicitud(solicitud.id, 'cancelada', { usuario, signal }), () => actualizar('Solicitud cancelada.'))
  }
  return <section>
    <h1>Mis solicitudes</h1>
    <Link className="btn btn-primary mb-3" to="/solicitudes/nueva">Crear solicitud</Link>
    {aviso && <p className="alert alert-success" role="status">{aviso}</p>}
    <ErrorOperacion error={operacion.error} />
    <EstadoConsulta consulta={consulta}>{datos => <>
      {!datos.items.length && <p role="status">No hay solicitudes en esta página.</p>}
      <div className="vstack gap-3">{datos.items.map(s => <article key={s.id} className="card card-body">
        <h2 className="h5">{s.iniciativa.titulo}</h2>
        <p><span className="badge text-bg-secondary">{s.estado}</span></p>
        <p style={{ whiteSpace: 'pre-wrap' }}>{s.mensaje}</p><p>Competencias: {s.competencias.join(', ')}</p><p>Disponibilidad: {s.disponibilidad}</p>
        {s.estado === 'pendiente' && (editando === s.id ? <FormularioSolicitud key={s.id} inicial={s}
          guardar={(datos, signal) => editarSolicitud(s.id, datos, { usuario, signal })}
          onGuardado={() => actualizar('Solicitud actualizada.')} onCancelar={() => setEditando(null)} /> :
          <div className="d-flex gap-2"><button disabled={operacion.ocupado} className="btn btn-outline-primary" onClick={() => setEditando(s.id)}>Editar</button>
            <button disabled={operacion.ocupado} className="btn btn-outline-danger" onClick={() => cancelar(s)}>Cancelar solicitud</button></div>)}
      </article>)}</div>
      <Paginacion datos={datos} onCambiar={valor => { setEditando(null); setPagina(valor) }} />
    </>}</EstadoConsulta>
  </section>
}
