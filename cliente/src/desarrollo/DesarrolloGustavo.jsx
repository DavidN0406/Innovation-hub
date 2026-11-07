import { useState } from 'react'
import { Link, Route, Routes } from 'react-router'
import { modoSimulado } from '../servicios/participacion/transporte.js'
import NoEncontrada from '../paginas/NoEncontrada.jsx'
export default function Desarrollo({ personas }) {
  const [usuarioId, setUsuarioId] = useState(personas[0]?.id ?? '')
  const usuario = personas.find(p => p.id === usuarioId) ?? null
  return <div className="container py-4">
    <header className="mb-4"><h1 className="h3">Innovation Hub · Participación</h1>
      {modoSimulado ? <div className="alert alert-info">
        <p>Desarrollo con datos simulados en memoria. Se reinician al recargar. Este selector no autentica usuarios.</p>
        <label htmlFor="persona">Probar como</label>
        <select id="persona" className="form-select" value={usuarioId} onChange={e => setUsuarioId(e.target.value)}>
          <option value="">Sin sesión</option>{personas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div> : <p className="alert alert-info">Modo API real. Integre las rutas con la sesión de la aplicación principal.</p>}
      <nav aria-label="Participación" className="d-flex flex-wrap gap-3">
        <Link to="/">Inicio</Link><Link to="/mis-solicitudes">Mis solicitudes</Link>
        <Link to="/solicitudes-recibidas">Solicitudes recibidas</Link><Link to="/proyectos">Proyectos</Link>
      </nav>
    </header>
    <main key={usuario?.id ?? 'visitante'}><Routes>
      <Route path="/" element={<p>Seleccione una pantalla del menú para comenzar.</p>} />
      <Route path="*" element={<NoEncontrada />} />
    </Routes></main>
  </div>
}


