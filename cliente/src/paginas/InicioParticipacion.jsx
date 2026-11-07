import { useState } from 'react'
import { Link } from 'react-router'
import SelectorIniciativa from '../componentes/participacion/SelectorIniciativa.jsx'
export default function InicioParticipacion({ usuario }) {
  const [id, setId] = useState('')
  return <section><h2>Participación y proyectos</h2>
    <p>Seleccione una iniciativa para consultar su equipo o solicitar participación.</p>
    <SelectorIniciativa usuario={usuario} scope="accessible" valor={id} onCambiar={setId} />
    {id && <div className="d-flex gap-3"><Link to={`/iniciativas/${id}/equipo`}>Consultar equipo</Link>
      <Link to={`/iniciativas/${id}/solicitar`}>Solicitar participación</Link></div>}
  </section>
}
