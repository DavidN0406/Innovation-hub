import { Route, Routes } from 'react-router'
import MisSolicitudes from '../paginas/MisSolicitudes.jsx'
import NuevaSolicitud from '../paginas/NuevaSolicitud.jsx'
import SolicitudesRecibidas from '../paginas/SolicitudesRecibidas.jsx'
import EquipoIniciativa from '../paginas/EquipoIniciativa.jsx'
import InicioParticipacion from '../paginas/InicioParticipacion.jsx'
import NoEncontrada from '../paginas/NoEncontrada.jsx'

export default function RutasGustavo({ usuario }) {
  if (!usuario) return <p className="alert alert-warning" role="status">Inicie sesión para consultar solicitudes, equipos y proyectos.</p>
  return <Routes>
    <Route path="/" element={<InicioParticipacion usuario={usuario} />} />
    <Route path="/mis-solicitudes" element={<MisSolicitudes usuario={usuario} />} />
    <Route path="/solicitudes-recibidas" element={<SolicitudesRecibidas usuario={usuario} />} />
    <Route path="/solicitudes/nueva" element={<NuevaSolicitud usuario={usuario} />} />
    <Route path="/iniciativas/:id/solicitar" element={<NuevaSolicitud usuario={usuario} />} />
    <Route path="/iniciativas/:id/equipo" element={<EquipoIniciativa usuario={usuario} />} />
    <Route path="*" element={<NoEncontrada />} />
  </Routes>
}
