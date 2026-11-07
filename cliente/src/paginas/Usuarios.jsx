import { useEffect, useState } from "react"
import { competenciasDisponibles } from "../datos/usuariosSimulados.js"
import { buscarUsuarios } from "../servicios/usuarios.js"

const filtrosIniciales = {
    nombre: "", competencia: "", carrera: "", disponibilidad: "", orden: "nombre-asc"
}

function Usuarios() {
    const [filtros, setFiltros] = useState({ ...filtrosIniciales })
    const [consulta, setConsulta] = useState({ ...filtrosIniciales, pagina: 1 })
    const [resultado, setResultado] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        let activo = true

        buscarUsuarios(consulta)
            .then((datos) => { if (activo) setResultado(datos) })
            .catch((error) => { if (activo) setError(error.message) })
            .finally(() => { if (activo) setCargando(false) })

        return () => { activo = false }
    }, [consulta])

    function cambiarFiltro(evento) {
        const { name, value } = evento.target
        setFiltros((anteriores) => ({ ...anteriores, [name]: value }))
    }

    function iniciarConsulta(nuevaConsulta) {
        setCargando(true)
        setError("")
        setConsulta(nuevaConsulta)
    }

    function buscar(evento) {
        evento.preventDefault()
        iniciarConsulta({ ...filtros, pagina: 1 })
    }

    function limpiar() {
        setFiltros({ ...filtrosIniciales })
        iniciarConsulta({ ...filtrosIniciales, pagina: 1 })
    }

    function cambiarPagina(pagina) {
        iniciarConsulta({ ...consulta, pagina })
    }

    return (
        <section className="py-4">
            <h1 className="mb-4">Buscar usuarios</h1>
            {import.meta.env.DEV && <p className="alert alert-info">Usuarios ficticios para probar la búsqueda.</p>}

            <form onSubmit={buscar} className="card card-body mb-4">
                <div className="row g-3">
                    <div className="col-12 col-md-6">
                        <label htmlFor="buscar-nombre" className="form-label">Nombre</label>
                        <input id="buscar-nombre" name="nombre" className="form-control"
                            value={filtros.nombre} onChange={cambiarFiltro} />
                    </div>
                    <div className="col-12 col-md-6">
                        <label htmlFor="buscar-carrera" className="form-label">Carrera</label>
                        <input id="buscar-carrera" name="carrera" className="form-control"
                            value={filtros.carrera} onChange={cambiarFiltro} />
                    </div>
                    <div className="col-12 col-md-4">
                        <label htmlFor="buscar-competencia" className="form-label">Competencia</label>
                        <select id="buscar-competencia" name="competencia" className="form-select"
                            value={filtros.competencia} onChange={cambiarFiltro}>
                            <option value="">Todas</option>
                            {competenciasDisponibles.map((competencia) => (
                                <option key={competencia} value={competencia}>{competencia}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-md-4">
                        <label htmlFor="buscar-disponibilidad" className="form-label">Disponibilidad</label>
                        <select id="buscar-disponibilidad" name="disponibilidad" className="form-select"
                            value={filtros.disponibilidad} onChange={cambiarFiltro}>
                            <option value="">Todas</option>
                            <option value="si">Disponible</option>
                            <option value="no">No disponible</option>
                        </select>
                    </div>
                    <div className="col-12 col-md-4">
                        <label htmlFor="buscar-orden" className="form-label">Ordenar por nombre</label>
                        <select id="buscar-orden" name="orden" className="form-select"
                            value={filtros.orden} onChange={cambiarFiltro}>
                            <option value="nombre-asc">A a Z</option>
                            <option value="nombre-desc">Z a A</option>
                        </select>
                    </div>
                </div>
                <div className="d-flex gap-2 mt-3">
                    <button type="submit" className="btn btn-primary" disabled={cargando}>Buscar</button>
                    <button type="button" className="btn btn-outline-secondary" onClick={limpiar}>Limpiar filtros</button>
                </div>
            </form>

            <div aria-busy={cargando}>
                {cargando ? <p role="status">Cargando usuarios…</p> : error ? (
                    <div>
                        <p className="alert alert-danger" role="alert">{error}</p>
                        <button className="btn btn-outline-primary" onClick={() => iniciarConsulta({ ...consulta })}>
                            Reintentar
                        </button>
                    </div>
                ) : !resultado || resultado.total === 0 ? (
                    <p className="alert alert-secondary" role="status">No se encontraron usuarios con esos filtros.</p>
                ) : (
                    <>
                        <p role="status">Resultados: {resultado.total}</p>
                        <div className="row g-3">
                            {resultado.usuarios.map((usuario) => (
                                <article className="col-12 col-md-6 col-lg-4" key={usuario.id}>
                                    <div className="card card-body h-100">
                                        <h2 className="h5">{usuario.nombre}</h2>
                                        <p className="text-break mb-2">{usuario.correo}</p>
                                        <p className="mb-2">{usuario.carrera || "Carrera sin completar"}</p>
                                        <p className="mb-3">{usuario.disponible ? "Disponible" : "No disponible"}</p>
                                        {usuario.competencias.length === 0 ? <p className="mb-0">Sin competencias registradas.</p> : (
                                            <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
                                                {usuario.competencias.map((competencia) => (
                                                    <li key={competencia}><span className="badge text-bg-primary">{competencia}</span></li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                        <nav className="d-flex flex-wrap align-items-center gap-3 mt-4" aria-label="Paginación de usuarios">
                            <button className="btn btn-outline-primary" disabled={resultado.pagina === 1}
                                onClick={() => cambiarPagina(resultado.pagina - 1)}>Anterior</button>
                            <span>Página {resultado.pagina} de {resultado.totalPaginas}</span>
                            <button className="btn btn-outline-primary" disabled={resultado.pagina === resultado.totalPaginas}
                                onClick={() => cambiarPagina(resultado.pagina + 1)}>Siguiente</button>
                        </nav>
                    </>
                )}
            </div>
        </section>
    )
}

export default Usuarios
