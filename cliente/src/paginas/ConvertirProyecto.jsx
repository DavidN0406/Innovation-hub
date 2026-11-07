import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { consultarEquipo } from '../servicios/equipos.js'
import { convertirIniciativa } from '../servicios/proyectos.js'
import useConsulta from '../hooks/useConsulta.js'
import EstadoConsulta from '../componentes/participacion/EstadoConsulta.jsx'
import FormularioProyecto from '../componentes/participacion/FormularioProyecto.jsx'

function Conversion({ id, usuario }) {
  const navegar = useNavigate()
  const cargar = useCallback(signal => consultarEquipo(id, { usuario, signal }), [id, usuario])
  const consulta = useConsulta(cargar)
  return <section><h1>Convertir iniciativa en proyecto</h1>
    <EstadoConsulta consulta={consulta}>{datos => {
      if (!datos.puedeRetirar) return <p className="alert alert-warning">Solo el propietario puede convertir esta iniciativa.</p>
      if (['Archivada', 'Convertida'].includes(datos.iniciativa.estado)) return <p className="alert alert-warning">La iniciativa está archivada o ya fue convertida.</p>
      if (!datos.miembros.some(m => String(m.usuarioId) !== String(datos.iniciativa.propietarioId))) return <p className="alert alert-warning">Necesita al menos otro integrante además del propietario.</p>
      return <><p>Iniciativa de origen: <strong>{datos.iniciativa.titulo}</strong>. El proyecto conservará esta referencia.</p>
        <FormularioProyecto titulo={datos.iniciativa.titulo}
          guardar={(datos, signal) => convertirIniciativa(id, datos, { usuario, signal })}
          onGuardado={proyecto => navegar(`/proyectos/${encodeURIComponent(proyecto.id)}`, { replace: true })} />
      </>
    }}</EstadoConsulta>
    <p className="mt-3"><Link to={`/iniciativas/${id}/equipo`}>Volver al equipo</Link></p>
  </section>
}
export default function ConvertirProyecto({ usuario }) {
  const { id } = useParams()
  return <Conversion key={`${id}-${usuario.id}`} id={id} usuario={usuario} />
}
