import { useCallback, useId, useState } from 'react'
import { listarIniciativasParticipacion } from '../../servicios/solicitudes.js'
import useConsulta from '../../hooks/useConsulta.js'
import EstadoConsulta from './EstadoConsulta.jsx'
import Paginacion from './Paginacion.jsx'

export default function SelectorIniciativa({ usuario, scope = 'owned', valor, onCambiar, todas = false }) {
  const id = useId()
  const [pagina, setPagina] = useState(1)
  const cargar = useCallback(signal => listarIniciativasParticipacion({ scope, page: pagina, size: 5 }, { usuario, signal }), [usuario, scope, pagina])
  const consulta = useConsulta(cargar)
  return <EstadoConsulta consulta={consulta}>{datos => <div className="mb-3">
    {!datos.items.length ? <p role="status">No hay iniciativas disponibles.</p> : <>
      <label htmlFor={id} className="form-label">Iniciativa</label>
      <select id={id} className="form-select" value={valor} onChange={e => onCambiar(e.target.value)}>
        <option value="">{todas ? 'Todas mis iniciativas' : 'Seleccione una iniciativa'}</option>
        {datos.items.map(i => <option key={i.id} value={i.id}>{i.titulo}</option>)}
      </select>
    </>}
    <Paginacion datos={datos} onCambiar={valor => { onCambiar(''); setPagina(valor) }} />
  </div>}</EstadoConsulta>
}
