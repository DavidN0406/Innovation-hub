import { useState } from 'react'
import { estadosProyecto, validarProyecto } from '../../servicios/participacion/validacion.js'
import useOperacion from '../../hooks/useOperacion.js'
import ErrorOperacion from './ErrorOperacion.jsx'

export default function FormularioProyecto({ titulo, guardar, onGuardado }) {
  const [datos, setDatos] = useState({ nombre: titulo, descripcion: '', objetivo: '', fechaInicio: '', estado: 'planificado', repositorio: '', tecnologias: '', fechaFinEstimada: '' })
  const [errores, setErrores] = useState({})
  const operacion = useOperacion()
  function cambiar(campo, valor) {
    setDatos(actual => ({ ...actual, [campo]: valor }))
    setErrores(actual => ({ ...actual, [campo]: '' }))
    operacion.limpiarError()
  }
  function enviar(e) {
    e.preventDefault()
    const payload = { ...datos, repositorio: datos.repositorio.trim(), fechaFinEstimada: datos.fechaFinEstimada || null, tecnologias: [...new Set(datos.tecnologias.split(',').map(t => t.trim()).filter(Boolean))] }
    const problemas = validarProyecto(payload)
    setErrores(problemas)
    if (!Object.keys(problemas).length) operacion.ejecutar(signal => guardar(payload, signal), onGuardado)
  }
  return <form className="card card-body" onSubmit={enviar} noValidate aria-busy={operacion.ocupado}>
    <ErrorOperacion error={operacion.error} />
    <fieldset disabled={operacion.ocupado}>
      <legend className="h5">Datos del proyecto</legend>
      {[['nombre', 'Nombre', 'text', 150], ['descripcion', 'Descripción', 'textarea', 4000], ['objetivo', 'Objetivo', 'textarea', 2000], ['fechaInicio', 'Fecha de inicio', 'date'], ['estado', 'Estado', 'select'], ['repositorio', 'Repositorio de GitHub (opcional)', 'url', 300], ['tecnologias', 'Tecnologías (opcionales, separadas por coma)', 'text', 3030], ['fechaFinEstimada', 'Fecha estimada de cierre (opcional)', 'date']].map(([campo, etiqueta, tipo, max]) => {
        const error = errores[campo] || operacion.error?.campos?.[campo]
        const props = { id: `proyecto-${campo}`, value: datos[campo], required: !['repositorio', 'tecnologias', 'fechaFinEstimada'].includes(campo),
          className: `${tipo === 'select' ? 'form-select' : 'form-control'}${error ? ' is-invalid' : ''}`,
          onChange: e => cambiar(campo, e.target.value), 'aria-invalid': Boolean(error), 'aria-describedby': error ? `error-proyecto-${campo}` : undefined }
        return <div className="mb-3" key={campo}>
          <label className="form-label" htmlFor={props.id}>{etiqueta}</label>
          {tipo === 'textarea' ? <textarea {...props} maxLength={max} rows={3} /> : tipo === 'select' ? <select {...props}>{estadosProyecto.map(e => <option key={e} value={e}>{e}</option>)}</select> : <input {...props} type={tipo} maxLength={max} />}
          {error && <p id={`error-proyecto-${campo}`} className="invalid-feedback">{String(error)}</p>}
        </div>
      })}
      <button className="btn btn-primary" type="submit">{operacion.ocupado ? 'Convirtiendo…' : 'Crear proyecto desde esta iniciativa'}</button>
    </fieldset>
  </form>
}
