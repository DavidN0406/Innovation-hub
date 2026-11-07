import { useState } from "react"
import { Link, NavLink } from "react-router"

const enlaces = [
    { texto: "Catálogo", ruta: "/catalogo" },
    { texto: "Registrar iniciativa", ruta: "/iniciativas/nueva" },
    { texto: "Mi perfil", ruta: "/perfil" },
    { texto: "Buscar usuarios", ruta: "/usuarios" }
]

function Navbar({ usuario, onCerrarSesion }) {
    const [menuAbierto, setMenuAbierto] = useState(false)

    function alternarMenu() {
        setMenuAbierto(function (estadoActual) {
            return !estadoActual
        })
    }

    function cerrarMenu() {
        setMenuAbierto(false)
    }

    return (
        <header>
            <nav
                className="navbar navbar-expand-xl navbar-dark bg-primary"
                aria-label="Principal"
            >
                <div className="container">
                    <Link
                        className="navbar-brand"
                        to="/"
                        onClick={cerrarMenu}
                    >
                        Innovation Hub
                    </Link>

                    <button
                        className="navbar-toggler"
                        type="button"
                        onClick={alternarMenu}
                        aria-controls="menu-principal"
                        aria-expanded={menuAbierto}
                        aria-label="Mostrar u ocultar el menú"
                    >
                        <span className="navbar-toggler-icon" />
                    </button>

                    <div
                        id="menu-principal"
                        className={
                            "collapse navbar-collapse" +
                            (menuAbierto ? " show" : "")
                        }
                    >
                        <ul className="navbar-nav ms-auto">
                            {enlaces.map(function (enlace) {
                                return (
                                    <li
                                        className="nav-item"
                                        key={enlace.ruta}
                                    >
                                        <NavLink
                                            className="nav-link"
                                            to={enlace.ruta}
                                            onClick={cerrarMenu}
                                            end
                                        >
                                            {enlace.texto}
                                        </NavLink>
                                    </li>
                                )
                            })}
                            {usuario ? (
                                <li className="nav-item d-flex align-items-center gap-2">
                                    <span className="navbar-text">{usuario.nombre}</span>
                                    <button type="button" className="btn btn-outline-light btn-sm"
                                        onClick={() => {
                                            cerrarMenu()
                                            onCerrarSesion()
                                        }}>
                                        Cerrar sesión
                                    </button>
                                </li>
                            ) : (
                                <>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/login" onClick={cerrarMenu}>
                                            Iniciar sesión
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/registro" onClick={cerrarMenu}>
                                            Crear cuenta
                                        </NavLink>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    )
}

export default Navbar
