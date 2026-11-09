import { useState } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router"
import { consultarSesion, cerrarSesion } from "./servicios/autenticacion.js"
import useConsulta from "./hooks/useConsulta.js"
import useOperacion from "./hooks/useOperacion.js"
import Catalogos from "./contexto/Catalogos.jsx"
import EstadoConsulta from "./componentes/participacion/EstadoConsulta.jsx"
import ErrorOperacion from "./componentes/participacion/ErrorOperacion.jsx"
import Pagina from "./componentes/layout/Pagina.jsx"
import Inicio from "./paginas/Inicio.jsx"
import NoEncontrada from "./paginas/NoEncontrada.jsx"
import Acceso from "./paginas/Acceso.jsx"
import Perfil from "./paginas/Perfil.jsx"
import Usuarios from "./paginas/Usuarios.jsx"
import Catalogo from "./paginas/Catalogo.jsx"
import DetalleIniciativa from "./paginas/DetalleIniciativa.jsx"
import RegistroIniciativa from "./paginas/RegistroIniciativa.jsx"
import MisSolicitudes from "./paginas/MisSolicitudes.jsx"
import NuevaSolicitud from "./paginas/NuevaSolicitud.jsx"
import SolicitudesRecibidas from "./paginas/SolicitudesRecibidas.jsx"
import EquipoIniciativa from "./paginas/EquipoIniciativa.jsx"
import ConvertirProyecto from "./paginas/ConvertirProyecto.jsx"
import Proyectos from "./paginas/Proyectos.jsx"
import DetalleProyecto from "./paginas/DetalleProyecto.jsx"

// Se consulta la cookie antes de decidir si una ruta privada debe redirigir.
const restaurar = async signal => ({ usuario: await consultarSesion({ signal }) })
export default function App() {
    const consulta = useConsulta(restaurar)
    return <EstadoConsulta consulta={consulta}>{datos => <Aplicacion usuarioInicial={datos.usuario} />}</EstadoConsulta>
}

function Aplicacion({ usuarioInicial }) {
    const [usuario, setUsuario] = useState(usuarioInicial)
    const navegar = useNavigate()
    const salida = useOperacion()
    function actualizarUsuario(perfil) {
        setUsuario(actual => actual?.id === perfil.id ? perfil : actual)
    }
    function salir() {
        salida.ejecutar(signal => cerrarSesion({ signal }), () => {
            setUsuario(null)
            navegar("/login", { replace: true })
        })
    }
    const privada = pantalla => usuario ? pantalla : <Navigate to="/login" replace />
    const rutas = <Routes key={usuario?.id ?? "visitante"}>
        <Route path="/" element={<Inicio />} />
        <Route path="/catalogo" element={<Catalogo usuario={usuario} />} />
        <Route path="/iniciativas/:id" element={<DetalleIniciativa usuario={usuario} />} />
        <Route path="/iniciativas/nueva" element={privada(<RegistroIniciativa usuario={usuario} />)} />
        <Route path="/iniciativas/:id/editar" element={privada(<RegistroIniciativa usuario={usuario} />)} />
        <Route path="/registro" element={usuario ? <Navigate to="/" replace /> : <Acceso key="registro" registro onAutenticar={setUsuario} />} />
        <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Acceso key="login" onAutenticar={setUsuario} />} />
        <Route path="/perfil" element={privada(<Perfil usuarioId={usuario?.id} onActualizar={actualizarUsuario} />)} />
        <Route path="/usuarios" element={privada(<Usuarios />)} />
        <Route path="/mis-solicitudes" element={privada(<MisSolicitudes usuario={usuario} />)} />
        <Route path="/solicitudes/nueva" element={privada(<NuevaSolicitud usuario={usuario} />)} />
        <Route path="/iniciativas/:id/solicitar" element={privada(<NuevaSolicitud usuario={usuario} />)} />
        <Route path="/solicitudes-recibidas" element={privada(<SolicitudesRecibidas usuario={usuario} />)} />
        <Route path="/iniciativas/:id/equipo" element={privada(<EquipoIniciativa usuario={usuario} />)} />
        <Route path="/iniciativas/:id/convertir" element={privada(<ConvertirProyecto usuario={usuario} />)} />
        <Route path="/proyectos" element={privada(<Proyectos usuario={usuario} />)} />
        <Route path="/proyectos/:id" element={privada(<DetalleProyecto usuario={usuario} />)} />
        <Route path="*" element={<NoEncontrada />} />
    </Routes>
    return <Pagina usuario={usuario} onCerrarSesion={salir} cerrandoSesion={salida.ocupado}>
        <ErrorOperacion error={salida.error} />
        {usuario ? <Catalogos key={usuario.id}>{rutas}</Catalogos> : rutas}
    </Pagina>
}
