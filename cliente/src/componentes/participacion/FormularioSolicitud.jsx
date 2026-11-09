import { useState } from 'react'
import { useCatalogos } from '../../contexto/useCatalogos.js'
import { validarSolicitud } from '../../servicios/participacion/validacion.js'
import useOperacion from '../../hooks/useOperacion.js'
import ErrorOperacion from './ErrorOperacion.jsx'

export default function FormularioSolicitud({ inicial, guardar, onGuardado, onCancelar }) {
  const { competencias } = useCatalogos()
  const [datos, setDatos] = useState({ mensaje: inicial?.mensaje ?? '', competencias: inicial?.competencias.join(', ') ?? '', disponibilidad: inicial?.disponibilidad ?? '', rolSolicitado: inicial?.rolSolicitado ?? 'Colaborador' })
  const [errores, setErrores] = useState({})
  const operacion = useOperacion()
  async function enviar(evento) {
    evento.preventDefault()
    const payload = { ...datos, competencias: [...new Set(datos.competencias.split(',').map(c => c.trim()).filter(Boolean))] }
    const problemas = validarSolicitud(payload)
    if (competencias.length && payload.competencias.some(c => !competencias.includes(c))) problemas.competencias = 'Seleccione competencias del catálogo.'
    setErrores(problemas)
    if (!Object.keys(problemas).length) await operacion.ejecutar(signal => guardar(payload, signal), onGuardado)
  }
  return <form onSubmit={enviar} noValidate aria-busy={operacion.ocupado}>
    <ErrorOperacion error={operacion.error} />
    <fieldset disabled={operacion.ocupado}>
      <legend className="h5">{inicial ? 'Editar solicitud pendiente' : 'Nueva solicitud de participación'}</legend>
      {[['mensaje', 'Motivación', 2000], ['competencias', 'Competencias (separadas por coma)', 2000], ['disponibilidad', 'Disponibilidad', 300], ['rolSolicitado', 'Rol solicitado', 100]].map(([campo, etiqueta, max]) => {
        const error = errores[campo] || operacion.error?.campos?.[campo]
        return <div className="mb-3" key={campo}>
          <label htmlFor={`solicitud-${campo}`} className="form-label">{etiqueta}</label>
          {campo === 'competencias' && competencias.length ? <select id={`solicitud-${campo}`} multiple
            className={`form-select${error ? ' is-invalid' : ''}`} value={datos.competencias.split(',').map(c => c.trim()).filter(Boolean)}
            aria-invalid={Boolean(error)} aria-describedby="ayuda-competencias-solicitud"
            onChange={e => {
              const valor = Array.from(e.target.selectedOptions, opcion => opcion.value).join(', ')
              setDatos(actual => ({ ...actual, competencias: valor }))
              setErrores(actual => ({ ...actual, competencias: '' })); operacion.limpiarError()
            }}>
            {competencias.map(c => <option key={c}>{c}</option>)}
          </select> : <textarea id={`solicitud-${campo}`} className={`form-control${error ? ' is-invalid' : ''}`} required maxLength={max}
            value={datos[campo]} aria-invalid={Boolean(error)} aria-describedby={error ? `error-${campo}` : undefined}
            onChange={e => { setDatos(actual => ({ ...actual, [campo]: e.target.value })); setErrores(actual => ({ ...actual, [campo]: '' })); operacion.limpiarError() }} />}
          {campo === 'competencias' && competencias.length > 0 && <small id="ayuda-competencias-solicitud">Puede seleccionar varias con Ctrl o Cmd.</small>}
          {error && <p id={`error-${campo}`} className="invalid-feedback">{String(error)}</p>}
        </div>
      })}
      <div className="d-flex gap-2"><button className="btn btn-primary" type="submit">{operacion.ocupado ? 'Guardando…' : 'Guardar solicitud'}</button>
        {onCancelar && <button className="btn btn-outline-secondary" type="button" onClick={onCancelar}>Cerrar edición</button>}
      </div>
    </fieldset>
  </form>
}
