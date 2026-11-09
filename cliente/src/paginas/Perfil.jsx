import { useEffect, useState } from "react"
import { useCatalogos } from "../contexto/useCatalogos.js"
import useOperacion from "../hooks/useOperacion.js"
import ErrorOperacion from "../componentes/participacion/ErrorOperacion.jsx"
import { actualizarPerfil, consultarPerfil } from "../servicios/usuarios.js"

function datosDelFormulario(perfil) {
    return {
        nombre: perfil.nombre,
        primerApellido: perfil.primerApellido, segundoApellido: perfil.segundoApellido ?? "",
        descripcion: perfil.descripcion ?? "", portafolio: perfil.portafolio ?? "",
        carrera: perfil.carrera,
        disponible: perfil.disponible,
        competencias: [...perfil.competencias],
        intereses: perfil.intereses.join(", ")
    }
}

function EditorPerfil({ perfil, onGuardar }) {
    const { competencias: competenciasDisponibles } = useCatalogos()
    const operacion = useOperacion()
    const guardando = operacion.ocupado
    const [formulario, setFormulario] = useState(() => datosDelFormulario(perfil))
    const [mensaje, setMensaje] = useState("")

    function cambiarCampo(evento) {
        const { name, value } = evento.target
        setFormulario((anterior) => ({
            ...anterior,
            [name]: name === "disponible" ? value === "true" : value
        }))
        operacion.limpiarError()
        setMensaje("")
    }

    function cambiarCompetencia(evento) {
        const { value, checked } = evento.target
        setFormulario((anterior) => ({
            ...anterior,
            competencias: checked
                ? [...anterior.competencias, value]
                : anterior.competencias.filter((competencia) => competencia !== value)
        }))
        operacion.limpiarError()
        setMensaje("")
    }

    function guardar(evento) {
        evento.preventDefault()
        setMensaje("")
        const intereses = [...new Set(formulario.intereses.split(",").map(valor => valor.trim()).filter(Boolean))]
        operacion.ejecutar(signal => actualizarPerfil(perfil.id, { ...formulario, intereses }, { signal }), actualizado => {
            setFormulario(datosDelFormulario(actualizado))
            onGuardar(actualizado)
            setMensaje("Perfil actualizado correctamente.")
        })
    }

    return (
        <form onSubmit={guardar} className="card card-body" aria-busy={guardando}>
            <h2 className="h4 mb-3">Editar perfil</h2>
            <ErrorOperacion error={operacion.error} />
            {mensaje && <p className="alert alert-success" role="status">{mensaje}</p>}

            <fieldset disabled={guardando}>
                <legend className="visually-hidden">Información del perfil</legend>
                <div className="mb-3">
                    <label htmlFor="nombre-perfil" className="form-label">Nombre</label>
                    <input id="nombre-perfil" name="nombre" className="form-control" required
                        maxLength={100} autoComplete="given-name" value={formulario.nombre} onChange={cambiarCampo} />
                </div>
                {[["primerApellido", "Primer apellido", 100], ["segundoApellido", "Segundo apellido", 100],
                    ["descripcion", "Presentación personal", 1000], ["portafolio", "Portafolio (enlace HTTPS)", 300]].map(([campo, etiqueta, maximo]) => (
                    <div className="mb-3" key={campo}>
                        <label htmlFor={`perfil-${campo}`} className="form-label">{etiqueta}</label>
                        <input id={`perfil-${campo}`} name={campo} className="form-control" maxLength={maximo}
                            type={campo === "portafolio" ? "url" : "text"} required={campo === "primerApellido"}
                            pattern={campo === "portafolio" ? "https://.*" : undefined}
                            value={formulario[campo]} onChange={cambiarCampo} />
                    </div>
                ))}
                <div className="mb-3">
                    <label htmlFor="correo-perfil" className="form-label">Correo electrónico</label>
                    <input id="correo-perfil" className="form-control" type="email"
                        value={perfil.correo} readOnly aria-describedby="ayuda-correo" />
                    <small id="ayuda-correo">El correo identifica su cuenta y no se puede modificar.</small>
                </div>
                <div className="mb-3">
                    <label htmlFor="carrera-perfil" className="form-label">Carrera</label>
                    <input id="carrera-perfil" name="carrera" className="form-control" maxLength={150} required
                        value={formulario.carrera} onChange={cambiarCampo} />
                </div>
                <div className="mb-3">
                    <label htmlFor="disponibilidad-perfil" className="form-label">Disponibilidad</label>
                    <select id="disponibilidad-perfil" name="disponible" className="form-select"
                        value={String(formulario.disponible)} onChange={cambiarCampo}>
                        <option value="true">Disponible para participar</option>
                        <option value="false">No disponible por ahora</option>
                    </select>
                </div>
                <fieldset className="mb-3">
                    <legend className="h5">Competencias</legend>
                    <div className="row g-2">
                        {competenciasDisponibles.map((competencia, indice) => (
                            <div className="col-12 col-sm-6" key={competencia}>
                                <div className="form-check">
                                    <input id={`competencia-${indice}`} type="checkbox" className="form-check-input"
                                        value={competencia} checked={formulario.competencias.includes(competencia)}
                                        onChange={cambiarCompetencia} />
                                    <label htmlFor={`competencia-${indice}`} className="form-check-label">{competencia}</label>
                                </div>
                            </div>
                        ))}
                    </div>
                </fieldset>
                <div className="mb-3">
                    <label htmlFor="intereses-perfil" className="form-label">Intereses</label>
                    <input id="intereses-perfil" name="intereses" className="form-control"
                        value={formulario.intereses} onChange={cambiarCampo} aria-describedby="ayuda-intereses" />
                    <small id="ayuda-intereses">Separe los intereses con comas.</small>
                </div>
                <button type="submit" className="btn btn-primary">
                    {guardando ? "Guardando…" : "Guardar cambios"}
                </button>
            </fieldset>
        </form>
    )
}

function Perfil({ usuarioId, onActualizar }) {
    const [perfil, setPerfil] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")
    const [intento, setIntento] = useState(0)

    useEffect(() => {
        let activo = true
        const control = new AbortController()

        consultarPerfil(usuarioId, { signal: control.signal })
            .then((datos) => { if (activo) setPerfil(datos) })
            .catch((error) => { if (activo) setError(error.message) })
            .finally(() => { if (activo) setCargando(false) })

        return () => { activo = false; control.abort() }
    }, [usuarioId, intento])

    function reintentar() {
        setCargando(true)
        setError("")
        setIntento((valor) => valor + 1)
    }

    function guardarPerfil(actualizado) {
        setPerfil(actualizado)
        onActualizar(actualizado)
    }

    return (
        <section className="py-4">
            <h1 className="mb-4">Mi perfil</h1>
            {cargando ? <p role="status">Cargando perfil…</p> : error ? (
                <div>
                    <p className="alert alert-danger" role="alert">{error}</p>
                    <button className="btn btn-outline-primary" onClick={reintentar}>
                        Reintentar
                    </button>
                </div>
            ) : !perfil ? <p>No hay información del perfil.</p> : (
                <div id="contenido" className="row g-4">
                    <div className="col-12 col-md-5 col-lg-4">
                        <section className="card card-body mb-4">
                            <h2 className="h4">Información personal</h2>
                            <dl className="mb-0">
                                <dt>Nombre</dt><dd>{[perfil.nombre, perfil.primerApellido, perfil.segundoApellido].filter(Boolean).join(" ")}</dd>
                                <dt>Correo</dt><dd className="text-break">{perfil.correo}</dd>
                                <dt>Rol</dt><dd>{perfil.rol}</dd>
                                <dt>Carrera</dt><dd>{perfil.carrera || "Sin completar"}</dd>
                                <dt>Disponibilidad</dt><dd>{perfil.disponible ? "Disponible" : "No disponible"}</dd>
                            </dl>
                        </section>
                        <section className="card card-body mb-4">
                            <h2 className="h4">Competencias</h2>
                            {perfil.competencias.length === 0 ? <p className="mb-0">Todavía no ha agregado competencias.</p> : (
                                <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
                                    {perfil.competencias.map((competencia) => (
                                        <li key={competencia}><span className="badge text-bg-primary">{competencia}</span></li>
                                    ))}
                                </ul>
                            )}
                        </section>
                        <section className="card card-body">
                            <h2 className="h4">Intereses</h2>
                            <p className="mb-0">{perfil.intereses.join(", ") || "Todavía no ha agregado intereses."}</p>
                        </section>
                    </div>
                    <div className="col-12 col-md-7 col-lg-8">
                        <EditorPerfil key={perfil.id} perfil={perfil} onGuardar={guardarPerfil} />
                    </div>
                </div>
            )}
        </section>
    )
}

export default Perfil
