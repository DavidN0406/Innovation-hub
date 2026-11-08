import { useState } from "react"
import { Link } from "react-router"
import { categoriasIniciativa, competenciasCatalogo, tiposIniciativa } from "../../datos/iniciativasSimuladas.js"
import { validarIniciativa, visibilidadesIniciativa } from "../../servicios/validacionIniciativa.js"
import useOperacion from "../../hooks/useOperacion.js"
import ErrorOperacion from "../participacion/ErrorOperacion.jsx"

function valoresIniciales(iniciativa) {
    return {
        titulo: iniciativa?.titulo ?? "", tipo: iniciativa?.tipo ?? "",
        categoria: iniciativa?.categoria ?? "", resumen: iniciativa?.resumen ?? "",
        descripcion: iniciativa?.descripcion ?? "", problema: iniciativa?.problema ?? "",
        beneficiarios: iniciativa?.beneficiarios ?? "",
        competencias: [...(iniciativa?.competencias ?? [])],
        participantesEstimados: String(iniciativa?.participantesEstimados ?? ""),
        visibilidad: iniciativa?.visibilidad ?? "", etiquetas: iniciativa?.etiquetas.join(", ") ?? ""
    }
}

function FormularioIniciativa({ inicial, guardar, onGuardado, rutaCancelar }) {
    const [datos, setDatos] = useState(() => valoresIniciales(inicial))
    const [errores, setErrores] = useState({})
    const operacion = useOperacion()

    function cambiarCampo(evento) {
        const { name, value } = evento.target
        setDatos((anteriores) => ({ ...anteriores, [name]: value }))
        setErrores((anteriores) => ({ ...anteriores, [name]: "" }))
        operacion.limpiarError()
    }

    function cambiarCompetencia(evento) {
        const { value, checked } = evento.target
        setDatos((anteriores) => ({
            ...anteriores,
            competencias: checked ? [...anteriores.competencias, value]
                : anteriores.competencias.filter((competencia) => competencia !== value)
        }))
        setErrores((anteriores) => ({ ...anteriores, competencias: "" }))
        operacion.limpiarError()
    }

    function errorCampo(nombre) {
        return errores[nombre] || operacion.error?.campos?.[nombre] || ""
    }

    function mensajeCampo(nombre) {
        const mensaje = errorCampo(nombre)
        return mensaje && <p id={`error-iniciativa-${nombre}`} className="text-danger small mt-1 mb-0">{String(mensaje)}</p>
    }

    function campoTexto(nombre, etiqueta, minimo, maximo, filas = 0) {
        const props = {
            id: `iniciativa-${nombre}`, name: nombre, value: datos[nombre],
            className: "form-control", required: true, minLength: minimo, maxLength: maximo,
            onChange: cambiarCampo, "aria-invalid": Boolean(errorCampo(nombre)),
            "aria-describedby": errorCampo(nombre) ? `error-iniciativa-${nombre}` : undefined
        }
        return (
            <div className="mb-3">
                <label htmlFor={props.id} className="form-label">{etiqueta}</label>
                {filas ? <textarea {...props} rows={filas} /> : <input {...props} type="text" />}
                {mensajeCampo(nombre)}
            </div>
        )
    }

    function enviar(evento) {
        evento.preventDefault()
        if (operacion.ocupado) return
        const payload = {
            ...datos,
            participantesEstimados: Number(datos.participantesEstimados),
            etiquetas: datos.etiquetas.split(",").map((etiqueta) => etiqueta.trim()).filter(Boolean)
        }
        const problemas = validarIniciativa(payload)
        setErrores(problemas)
        if (Object.keys(problemas).length) {
            evento.currentTarget.querySelector(`[name="${Object.keys(problemas)[0]}"]`)?.focus()
            return
        }
        operacion.ejecutar((signal) => guardar(payload, signal), onGuardado)
    }

    return (
        <form onSubmit={enviar} noValidate aria-busy={operacion.ocupado}>
            <ErrorOperacion error={operacion.error} />
            {Object.keys(errores).some((campo) => errores[campo]) && (
                <p className="alert alert-danger" role="alert">Revise los campos marcados antes de guardar.</p>
            )}
            <fieldset disabled={operacion.ocupado}>
                <legend className="visually-hidden">Datos de la iniciativa</legend>
                <section className="card card-body mb-4">
                    <h2 className="h5 mb-3">Información general</h2>
                    {campoTexto("titulo", "Título", 5, 80)}
                    <div className="row g-3 mb-3">
                        {[
                            { nombre: "tipo", etiqueta: "Tipo", opciones: tiposIniciativa },
                            { nombre: "categoria", etiqueta: "Categoría", opciones: categoriasIniciativa }
                        ].map(({ nombre, etiqueta, opciones }) => (
                            <div className="col-12 col-md-6" key={nombre}>
                                <label htmlFor={`iniciativa-${nombre}`} className="form-label">{etiqueta}</label>
                                <select id={`iniciativa-${nombre}`} name={nombre} className="form-select" required
                                    value={datos[nombre]} onChange={cambiarCampo} aria-invalid={Boolean(errorCampo(nombre))}
                                    aria-describedby={errorCampo(nombre) ? `error-iniciativa-${nombre}` : undefined}>
                                    <option value="">Seleccione una opción</option>
                                    {opciones.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
                                </select>
                                {mensajeCampo(nombre)}
                            </div>
                        ))}
                    </div>
                    {campoTexto("resumen", "Resumen", 20, 200, 3)}
                    {campoTexto("descripcion", "Descripción", 30, 1000, 5)}
                </section>

                <section className="card card-body mb-4">
                    <h2 className="h5 mb-3">Problema y beneficiarios</h2>
                    {campoTexto("problema", "Problema identificado", 15, 500, 3)}
                    {campoTexto("beneficiarios", "Beneficiarios", 3, 150)}
                </section>

                <section className="card card-body mb-4">
                    <h2 className="h5 mb-3">Participación y visibilidad</h2>
                    <fieldset className="mb-3" aria-describedby={errorCampo("competencias") ? "error-iniciativa-competencias" : undefined}>
                        <legend className="h6">Competencias necesarias</legend>
                        <div className="row g-2">
                            {competenciasCatalogo.map((competencia, indice) => (
                                <div className="col-12 col-md-6" key={competencia}>
                                    <div className="form-check">
                                        <input id={`iniciativa-competencia-${indice}`} name="competencias" type="checkbox"
                                            className="form-check-input" value={competencia}
                                            checked={datos.competencias.includes(competencia)} onChange={cambiarCompetencia}
                                            aria-invalid={Boolean(errorCampo("competencias"))} />
                                        <label htmlFor={`iniciativa-competencia-${indice}`} className="form-check-label">{competencia}</label>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {mensajeCampo("competencias")}
                    </fieldset>
                    <div className="row g-3 mb-3">
                        <div className="col-12 col-md-6">
                            <label htmlFor="iniciativa-participantes" className="form-label">Cantidad estimada de participantes</label>
                            <input id="iniciativa-participantes" name="participantesEstimados" type="number"
                                className="form-control" required min={1} max={50} step={1}
                                value={datos.participantesEstimados} onChange={cambiarCampo}
                                aria-invalid={Boolean(errorCampo("participantesEstimados"))}
                                aria-describedby={errorCampo("participantesEstimados") ? "error-iniciativa-participantesEstimados" : undefined} />
                            {mensajeCampo("participantesEstimados")}
                        </div>
                        <div className="col-12 col-md-6">
                            <label htmlFor="iniciativa-visibilidad" className="form-label">Nivel de visibilidad</label>
                            <select id="iniciativa-visibilidad" name="visibilidad" className="form-select" required
                                value={datos.visibilidad} onChange={cambiarCampo} aria-invalid={Boolean(errorCampo("visibilidad"))}
                                aria-describedby={errorCampo("visibilidad") ? "error-iniciativa-visibilidad" : undefined}>
                                <option value="">Seleccione una opción</option>
                                {visibilidadesIniciativa.map((opcion) => <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>)}
                            </select>
                            {mensajeCampo("visibilidad")}
                        </div>
                    </div>
                    <label htmlFor="iniciativa-etiquetas" className="form-label">Etiquetas (separadas por coma)</label>
                    <input id="iniciativa-etiquetas" name="etiquetas" className="form-control" value={datos.etiquetas}
                        onChange={cambiarCampo} aria-invalid={Boolean(errorCampo("etiquetas"))}
                        aria-describedby={errorCampo("etiquetas") ? "error-iniciativa-etiquetas" : "ayuda-etiquetas"} />
                    <small id="ayuda-etiquetas">Opcional: hasta 5 etiquetas de máximo 20 caracteres.</small>
                    {mensajeCampo("etiquetas")}
                </section>
                <div className="d-flex flex-wrap gap-2">
                    <button type="submit" className="btn btn-primary">
                        {operacion.ocupado ? "Guardando…" : inicial ? "Guardar cambios" : "Registrar iniciativa"}
                    </button>
                    <Link to={rutaCancelar} className="btn btn-outline-secondary">Cancelar</Link>
                </div>
            </fieldset>
        </form>
    )
}

export default FormularioIniciativa
