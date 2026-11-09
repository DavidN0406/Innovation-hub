import { useEffect, useState } from "react"
import { Link, useParams, useNavigate } from "react-router"
import { archivarIniciativa, consultarIniciativa, eliminarIniciativa } from "../servicios/iniciativas.js"
import useOperacion from "../hooks/useOperacion.js"
import ErrorOperacion from "../componentes/participacion/ErrorOperacion.jsx"

function formatearFecha(fecha) {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CR", {
        year: "numeric", month: "long", day: "numeric"
    })
}

function ContenidoDetalle({ id, usuario }) {
    const navegar = useNavigate()
    const usuarioId = usuario?.id ?? null
    const [iniciativa, setIniciativa] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    const [intento, setIntento] = useState(0)
    const [aviso, setAviso] = useState("")
    const operacion = useOperacion()

    useEffect(() => {
        let activo = true
        const control = new AbortController()

        consultarIniciativa(id, usuarioId, { signal: control.signal })
            .then((datos) => { if (activo) setIniciativa(datos) })
            .catch((error) => {
                if (activo) setError({ mensaje: error.message, estado: error.estado })
            })
            .finally(() => { if (activo) setCargando(false) })

        return () => { activo = false; control.abort() }
    }, [id, usuarioId, intento])

    function reintentar() {
        setCargando(true)
        setError(null)
        setIntento((anterior) => anterior + 1)
    }

    function archivar() {
        if (!window.confirm(`¿Archivar «${iniciativa.titulo}»? Saldrá del catálogo activo y se conservará su información.`)) return
        operacion.ejecutar((signal) => archivarIniciativa(id, usuario, { signal }), () => {
            setAviso("Iniciativa archivada. Puede consultarla en el catálogo marcando Solo mis iniciativas y el estado Archivada.")
            reintentar()
        })
    }

    function eliminar() {
        if (!window.confirm(`¿Eliminar «${iniciativa.titulo}»? Si tiene solicitudes, integrantes o un proyecto, se archivará para conservar su historial.`)) return
        operacion.ejecutar(signal => eliminarIniciativa(id, { signal }), resultado => {
            if (resultado?.accion === "archivada") {
                setAviso("La iniciativa tenía información relacionada y se archivó para conservarla.")
                reintentar()
            } else navegar("/catalogo", { replace: true })
        })
    }

    if (cargando) {
        return <p className="py-4" role="status">Cargando iniciativa…</p>
    }

    if (error || !iniciativa) {
        return (
            <section className="py-4">
                <h1 className="h3">No se pudo mostrar la iniciativa</h1>
                <p className="alert alert-danger" role="alert">
                    {error?.mensaje || "No hay información disponible."}
                </p>
                <div className="d-flex flex-wrap gap-2">
                    {error && error.estado !== 404 && (
                        <button className="btn btn-primary" onClick={reintentar}>Reintentar</button>
                    )}
                    <Link to="/catalogo" className="btn btn-outline-secondary">Volver al catálogo</Link>
                </div>
            </section>
        )
    }

    const { permisos } = iniciativa
    const visibilidad = { publica: "Pública", institucional: "Institucional", restringida: "Restringida", privada: "Privada" }[iniciativa.visibilidad]
        || iniciativa.visibilidad
    const ruta = `/iniciativas/${iniciativa.id}`

    return (
        <article id="contenido" className="py-4">
            <h1 className="mb-2">{iniciativa.titulo}</h1>
            <p className="text-body-secondary mb-2">{iniciativa.tipo} · {iniciativa.categoria}</p>
            <p className="d-flex flex-wrap gap-2 mb-4">
                <span className="badge text-bg-secondary">{iniciativa.estado}</span>
                <span className="badge text-bg-light border">Visibilidad: {visibilidad}</span>
            </p>

            <section className="card card-body mb-4">
                <h2 className="h4 card-title">Resumen</h2>
                <p className="card-text mb-0">{iniciativa.resumen}</p>
            </section>

            {!iniciativa.accesoCompleto ? (
                <p id="avisoRestringida" className="alert alert-warning" role="note">
                    <strong>Contenido restringido.</strong> Solo está disponible el resumen de esta iniciativa. Competencias requeridas: {iniciativa.competencias.join(", ")}.
                </p>
            ) : (
                <div className="row g-4">
                    <div className="col-12 col-lg-7">
                        <section className="card card-body mb-4">
                            <h2 className="h4 card-title">Descripción</h2>
                            <p className="card-text" style={{ whiteSpace: "pre-line" }}>{iniciativa.descripcion}</p>
                            <p className="small text-body-secondary mb-0">
                                Publicado por <strong>{iniciativa.autor}</strong> el {" "}
                                <time dateTime={iniciativa.fechaPublicacion}>{formatearFecha(iniciativa.fechaPublicacion)}</time>
                            </p>
                        </section>
                        <section className="card card-body mb-4">
                            <h2 className="h4 card-title">Problema identificado</h2>
                            <p className="mb-0" style={{ whiteSpace: "pre-line" }}>{iniciativa.problema}</p>
                        </section>
                        <section className="card card-body">
                            <h2 className="h4 card-title">Beneficiarios</h2>
                            <p className="mb-0">{iniciativa.beneficiarios}</p>
                        </section>
                    </div>

                    <div className="col-12 col-lg-5">
                        <section className="card card-body mb-4">
                            <h2 className="h5 card-title">Competencias requeridas</h2>
                            {iniciativa.competencias.length === 0 ? (
                                <p className="mb-0">No hay competencias especificadas.</p>
                            ) : (
                                <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
                                    {iniciativa.competencias.map((competencia) => (
                                        <li className="badge text-bg-light border" key={competencia}>{competencia}</li>
                                    ))}
                                </ul>
                            )}
                        </section>
                        <section className="card mb-4">
                            <div className="card-body pb-0">
                                <h2 className="h5 card-title">Equipo</h2>
                            </div>
                            {iniciativa.equipo.length === 0 ? (
                                <p className="px-3">Todavía no hay integrantes registrados.</p>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {iniciativa.equipo.map((integrante) => (
                                        <li className="list-group-item" key={integrante.usuarioId}>
                                            <strong>{integrante.nombre}</strong>
                                            <span className="d-block small text-body-secondary">{integrante.rol}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="card-footer small text-body-secondary">
                                Integrantes: {iniciativa.equipo.length}. Participantes estimados: {iniciativa.participantesEstimados}.
                            </div>
                        </section>
                        <section className="card card-body">
                            <h2 className="h5 card-title">Etiquetas</h2>
                            {iniciativa.etiquetas.length === 0 ? <p className="mb-0">Sin etiquetas.</p> : (
                                <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
                                    {iniciativa.etiquetas.map((etiqueta) => (
                                        <li className="badge text-bg-light border" key={etiqueta}>{etiqueta}</li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                </div>
            )}

            {aviso && <p className="alert alert-success mt-4" role="status">{aviso}</p>}
            <ErrorOperacion error={operacion.error} />
            <div className="mt-4 d-flex flex-wrap gap-2">
                {permisos.puedeSolicitar && (
                    <Link to={`${ruta}/solicitar`} className="btn btn-primary">Solicitar participación</Link>
                )}
                {!usuario && !["Archivada", "Convertida"].includes(iniciativa.estado) && (
                    <Link to="/login" className="btn btn-primary">Iniciar sesión para participar</Link>
                )}
                {permisos.puedeEditar && (
                    <Link to={`${ruta}/editar`} className="btn btn-outline-primary">Editar iniciativa</Link>
                )}
                {permisos.puedeArchivar && (
                    <button type="button" className="btn btn-outline-danger" onClick={archivar} disabled={operacion.ocupado}>
                        {operacion.ocupado ? "Archivando…" : "Archivar iniciativa"}
                    </button>
                )}
                {permisos.puedeArchivar && <button type="button" className="btn btn-outline-danger" onClick={eliminar} disabled={operacion.ocupado}>
                    Eliminar iniciativa
                </button>}
                {usuario && permisos.puedeVerEquipo && (
                    <Link to={`${ruta}/equipo`} className="btn btn-outline-primary">Ver equipo</Link>
                )}
                {permisos.puedeConvertir && (
                    <Link to={`${ruta}/convertir`} className="btn btn-outline-primary">Convertir en proyecto</Link>
                )}
                <Link to="/catalogo" className="btn btn-outline-secondary">Volver al catálogo</Link>
            </div>
            {permisos.faltaMiembroParaConvertir && (
                <p className="mt-3 text-body-secondary">Para convertir esta iniciativa en proyecto necesita al menos otro integrante.</p>
            )}
        </article>
    )
}

function DetalleIniciativa({ usuario }) {
    const { id } = useParams()

    // Cambiar de iniciativa o de usuario reinicia la carga y evita mostrar datos anteriores.
    return <ContenidoDetalle key={`${id}-${usuario?.id ?? "visitante"}`} id={id} usuario={usuario} />
}

export default DetalleIniciativa
