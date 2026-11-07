import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { consultarEquipo, retirarIntegrante } from '../servicios/equipos.js'
import useConsulta from '../hooks/useConsulta.js'
import useOperacion from '../hooks/useOperacion.js'
import EstadoConsulta from '../componentes/participacion/EstadoConsulta.jsx'
import ErrorOperacion from '../componentes/participacion/ErrorOperacion.jsx'

function Equipo({ id, usuario }) {
  const [aviso, setAviso] = useState('')
  const operacion = useOperacion()
  const cargar = useCallback(signal => consultarEquipo(id, { usuario, signal }), [id, usuario])
  const consulta = useConsulta(cargar)
  function retirar(miembro) {
    if (!window.confirm(`¿Retirar a ${miembro.nombre} del equipo?`)) return
    operacion.ejecutar(signal => retirarIntegrante(id, miembro.usuarioId, { usuario, signal }), () => {
      setAviso('Integrante retirado del equipo.')
      consulta.recargar()
    })
  }
  return <section><h1>Gestión del equipo</h1>
    {aviso && <p className="alert alert-success" role="status">{aviso}</p>}
    <ErrorOperacion error={operacion.error} />
    <EstadoConsulta consulta={consulta}>{datos => <>
      <h2 className="h4">{datos.iniciativa.titulo}</h2>
      {!datos.miembros.length ? <p role="status">No hay integrantes registrados.</p> : <ul className="list-group mb-3">
        {datos.miembros.map(m => <li key={m.usuarioId} className="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div><strong>{m.nombre}</strong><span className="d-block text-body-secondary">{m.rol}{String(m.usuarioId) === String(datos.iniciativa.propietarioId) ? ' · Propietario' : ''}</span></div>
          {datos.puedeRetirar && String(m.usuarioId) !== String(datos.iniciativa.propietarioId) && <button className="btn btn-outline-danger" disabled={operacion.ocupado} onClick={() => retirar(m)}>Retirar a {m.nombre}</button>}
        </li>)}
      </ul>}
      {datos.puedeRetirar && <><p>El propietario permanece en el equipo.</p>
        {datos.miembros.some(m => String(m.usuarioId) !== String(datos.iniciativa.propietarioId))
          ? <Link className="btn btn-primary mb-3" to={`/iniciativas/${id}/convertir`}>Convertir en proyecto</Link>
          : <p className="alert alert-info">Para convertir la iniciativa necesita al menos otro integrante.</p>}
      </>}
    </>}</EstadoConsulta>
    <p><Link to="/solicitudes-recibidas">Solicitudes recibidas</Link> · <Link to="/">Volver al inicio</Link></p>
  </section>
}
export default function EquipoIniciativa({ usuario }) {
  const { id } = useParams()
  return <Equipo key={`${id}-${usuario.id}`} id={id} usuario={usuario} />
}
