import { Route, Routes } from "react-router"

import Pagina from "./componentes/layout/Pagina.jsx"
import Inicio from "./paginas/Inicio.jsx"
import PaginaPendiente from "./paginas/PaginaPendiente.jsx"
import NoEncontrada from "./paginas/NoEncontrada.jsx"

// Rutas preparadas para las funcionalidades del avance.
const rutasPendientes = [
    { ruta: "/catalogo", titulo: "Catálogo de iniciativas" },
    { ruta: "/iniciativas/nueva", titulo: "Registrar iniciativa" },
    { ruta: "/iniciativas/:id", titulo: "Detalle de iniciativa" },
    { ruta: "/iniciativas/:id/editar", titulo: "Editar iniciativa" },
    { ruta: "/iniciativas/:id/solicitar", titulo: "Solicitar participación" },
    { ruta: "/iniciativas/:id/equipo", titulo: "Equipo de la iniciativa" },
    { ruta: "/iniciativas/:id/convertir", titulo: "Convertir en proyecto" },
    { ruta: "/perfil", titulo: "Mi perfil" },
    { ruta: "/usuarios", titulo: "Buscar usuarios" },
    { ruta: "/mis-solicitudes", titulo: "Mis solicitudes" },
    { ruta: "/solicitudes-recibidas", titulo: "Solicitudes recibidas" },
    { ruta: "/proyectos", titulo: "Proyectos" },
    { ruta: "/proyectos/:id", titulo: "Detalle de proyecto" },
    { ruta: "/registro", titulo: "Crear cuenta" },
    { ruta: "/login", titulo: "Iniciar sesión" }
]

// Mantiene la estructura compartida y cambia el contenido según la ruta.
function App() {
    return (
        <Pagina>
            <Routes>
                <Route path="/" element={<Inicio />} />

                {rutasPendientes.map(function (ruta) {
                    return (
                        <Route
                            key={ruta.ruta}
                            path={ruta.ruta}
                            element={
                                <PaginaPendiente titulo={ruta.titulo} />
                            }
                        />
                    )
                })}

                <Route path="*" element={<NoEncontrada />} />
            </Routes>
        </Pagina>
    )
}

export default App