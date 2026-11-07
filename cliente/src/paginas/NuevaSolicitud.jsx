import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { listarIniciativasParticipacion, crearSolicitud } from '../servicios/solicitudes.js'
import useConsulta from '../hooks/useConsulta.js'
import EstadoConsulta from '../componentes/participacion/EstadoConsulta.jsx'
import Paginacion from '../componentes/participacion/Paginacion.jsx'
import FormularioSolicitud from '../componentes/participacion/FormularioSolicitud.jsx'

export default function NuevaSolicitud({ usuario }) {
  const { id } = useParams()
  const navegar = useNavigate()
  const [seleccion, setSeleccion] = useState(id ?? '')
  const [pagina, setPagina] = useState(1)
  const cargar = useCallback(signal => listarIniciativasParticipacion({ scope: 'accessible', page: pagina, size: 5 }, { usuario, signal }), [usuario, pagina])
  const consulta = useConsulta(cargar)
  return <section><h1>Solicitar participación</h1>
    {id ? <p>Iniciativa: {id}</p> : <EstadoConsulta consulta={consulta}>{datos => <>
      {!datos.items.length ? <p role="status">No hay iniciativas disponibles.</p> : <div className="mb-3">
        <label htmlFor="iniciativa-nueva" className="form-label">Iniciativa</label>
        <select id="iniciativa-nueva" className="form-select" value={seleccion} onChange={e => setSeleccion(e.target.value)}>
          <option value="">Seleccione una iniciativa</option>
          {datos.items.map(i => <option key={i.id} value={i.id} disabled={i.propietarioId === usuario.id || ['Archivada', 'Convertida'].includes(i.estado)}>{i.titulo}</option>)}
        </select>
      </div>}
      <Paginacion datos={datos} onCambiar={valor => { setSeleccion(''); setPagina(valor) }} />
    </>}</EstadoConsulta>}
    {seleccion && <div className="card card-body mb-3"><FormularioSolicitud key={seleccion}
      guardar={(datos, signal) => crearSolicitud(seleccion, datos, { usuario, signal })}
      onGuardado={() => navegar('/mis-solicitudes')} /></div>}
    <Link to="/mis-solicitudes">Volver a mis solicitudes</Link>
  </section>
}
