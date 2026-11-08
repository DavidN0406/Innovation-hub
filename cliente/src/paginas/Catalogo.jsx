import { useEffect, useState } from "react"
import { categoriasIniciativa, competenciasCatalogo, tiposIniciativa } from "../datos/iniciativasSimuladas.js"
import { buscarIniciativas } from "../servicios/iniciativas.js"
import TarjetaIniciativa from "../componentes/iniciativas/TarjetaIniciativa.jsx"

const filtrosIniciales = {
    texto: "", tipo: "", categoria: "", competencia: "", orden: "fecha-desc", tamano: 3,
    soloPropias: false, incluirArchivadas: false
}

const selectores = [
    { nombre: "tipo", etiqueta: "Tipo", opciones: tiposIniciativa },
    { nombre: "categoria", etiqueta: "Categoría", opciones: categoriasIniciativa },
    { nombre: "competencia", etiqueta: "Competencia requerida", opciones: competenciasCatalogo }
]

function Catalogo({ usuario }) {
    const usuarioId = usuario?.id ?? null
    const [filtros, setFiltros] = useState({ ...filtrosIniciales })
    const [consulta, setConsulta] = useState({ ...filtrosIniciales, pagina: 1 })
    const [resultado, setResultado] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        let activo = true

        buscarIniciativas(consulta, { usuarioId })
            .then((datos) => { if (activo) setResultado(datos) })
            .catch((error) => { if (activo) setError(error.message) })
            .finally(() => { if (activo) setCargando(false) })

        return () => { activo = false }
    }, [consulta, usuarioId])

    function cambiarFiltro(evento) {
        const { name, value } = evento.target
        setFiltros((anteriores) => ({
            ...anteriores,
            [name]: name === "tamano" ? Number(value) : value
        }))
    }

    function cambiarAmbito(evento) {
        const { name, checked } = evento.target
        setFiltros((anteriores) => ({
            ...anteriores,
            [name]: checked,
            ...(name === "soloPropias" && !checked ? { incluirArchivadas: false } : {})
        }))
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

    return (
        <div className="py-4">
            <h1 className="mb-4">Catálogo de iniciativas</h1>
            {import.meta.env.DEV && (
                <p className="alert alert-info">Datos de prueba en memoria. Las iniciativas nuevas y sus cambios se pierden al recargar.</p>
            )}

            <div className="row g-4">
                <aside className="col-12 col-lg-3" aria-labelledby="titulo-filtros">
                    <div className="card card-body">
                        <h2 id="titulo-filtros" className="h5 card-title">Filtrar iniciativas</h2>
                        <form onSubmit={buscar}>
                            <div className="mb-3">
                                <label htmlFor="filtro-texto" className="form-label">Buscar</label>
                                <input id="filtro-texto" name="texto" className="form-control"
                                    value={filtros.texto} onChange={cambiarFiltro}
                                    aria-describedby="ayuda-busqueda" />
                                <small id="ayuda-busqueda">Busque por título o resumen.</small>
                            </div>
                            {selectores.map((selector) => (
                                <div className="mb-3" key={selector.nombre}>
                                    <label htmlFor={`filtro-${selector.nombre}`} className="form-label">
                                        {selector.etiqueta}
                                    </label>
                                    <select id={`filtro-${selector.nombre}`} name={selector.nombre}
                                        className="form-select" value={filtros[selector.nombre]} onChange={cambiarFiltro}>
                                        <option value="">Cualquiera</option>
                                        {selector.opciones.map((opcion) => (
                                            <option value={opcion} key={opcion}>{opcion}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                            <div className="mb-3">
                                <label htmlFor="filtro-orden" className="form-label">Ordenar</label>
                                <select id="filtro-orden" name="orden" className="form-select"
                                    value={filtros.orden} onChange={cambiarFiltro}>
                                    <option value="fecha-desc">Más recientes primero</option>
                                    <option value="fecha-asc">Más antiguas primero</option>
                                    <option value="titulo-asc">Título: A a Z</option>
                                    <option value="titulo-desc">Título: Z a A</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="filtro-tamano" className="form-label">Resultados por página</label>
                                <select id="filtro-tamano" name="tamano" className="form-select"
                                    value={filtros.tamano} onChange={cambiarFiltro}>
                                    <option value={3}>3</option>
                                    <option value={6}>6</option>
                                    <option value={9}>9</option>
                                </select>
                            </div>
                            {usuario && (
                                <div className="mb-3">
                                    <div className="form-check">
                                        <input id="filtro-propias" name="soloPropias" type="checkbox" className="form-check-input"
                                            checked={filtros.soloPropias} onChange={cambiarAmbito} />
                                        <label htmlFor="filtro-propias" className="form-check-label">Solo mis iniciativas</label>
                                    </div>
                                    {filtros.soloPropias && (
                                        <div className="form-check mt-2">
                                            <input id="filtro-archivadas" name="incluirArchivadas" type="checkbox" className="form-check-input"
                                                checked={filtros.incluirArchivadas} onChange={cambiarAmbito} />
                                            <label htmlFor="filtro-archivadas" className="form-check-label">Incluir archivadas</label>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="d-grid gap-2">
                                <button type="submit" className="btn btn-primary" disabled={cargando}>
                                    Aplicar filtros
                                </button>
                                <button type="button" className="btn btn-outline-secondary" onClick={limpiar}>
                                    Limpiar filtros
                                </button>
                            </div>
                        </form>
                    </div>
                </aside>

                <section className="col-12 col-lg-9" aria-labelledby="titulo-resultados" aria-busy={cargando}>
                    <h2 id="titulo-resultados" className="h4 mb-3">Resultados</h2>
                    {cargando ? <p role="status">Cargando iniciativas…</p> : error ? (
                        <div>
                            <p className="alert alert-danger" role="alert">{error}</p>
                            <button className="btn btn-outline-primary" onClick={() => iniciarConsulta({ ...consulta })}>
                                Reintentar
                            </button>
                        </div>
                    ) : !resultado || resultado.total === 0 ? (
                        <p className="alert alert-secondary" role="status">No se encontraron iniciativas con esos filtros.</p>
                    ) : (
                        <>
                            <p role="status">Iniciativas encontradas: {resultado.total}</p>
                            <div className="row g-4">
                                {resultado.iniciativas.map((iniciativa) => (
                                    <div className="col-12 col-md-6 col-xl-4" key={iniciativa.id}>
                                        <TarjetaIniciativa iniciativa={iniciativa} />
                                    </div>
                                ))}
                            </div>
                            <nav className="d-flex flex-wrap align-items-center gap-3 mt-4" aria-label="Paginación de iniciativas">
                                <button className="btn btn-outline-primary" disabled={resultado.pagina === 1}
                                    onClick={() => iniciarConsulta({ ...consulta, pagina: resultado.pagina - 1 })}>
                                    Anterior
                                </button>
                                <span>Página {resultado.pagina} de {resultado.totalPaginas}</span>
                                <button className="btn btn-outline-primary" disabled={resultado.pagina === resultado.totalPaginas}
                                    onClick={() => iniciarConsulta({ ...consulta, pagina: resultado.pagina + 1 })}>
                                    Siguiente
                                </button>
                            </nav>
                        </>
                    )}
                </section>
            </div>
        </div>
    )
}

export default Catalogo
