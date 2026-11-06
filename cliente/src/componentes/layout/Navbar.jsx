import { useState } from "react"

const enlaces = [
    { texto: "Catálogo", ruta: "/catalogo" },
    { texto: "Registrar iniciativa", ruta: "/iniciativas/nueva" },
    { texto: "Mi perfil", ruta: "/perfil" }
]

// Barra de navegación con un menú desplegable en pantallas pequeñas.
function Navbar() {
    const [menuAbierto, setMenuAbierto] = useState(false)

    function alternarMenu() {
        setMenuAbierto(function (estadoActual) {
            return !estadoActual
        })
    }

    return (
        <header>
            <nav
                className="navbar navbar-expand-md navbar-dark bg-primary"
                aria-label="Principal"
            >
                <div className="container">
                    <a className="navbar-brand" href="/">
                        Innovation Hub
                    </a>

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
                                        <a
                                            className="nav-link"
                                            href={enlace.ruta}
                                        >
                                            {enlace.texto}
                                        </a>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    )
}

export default Navbar