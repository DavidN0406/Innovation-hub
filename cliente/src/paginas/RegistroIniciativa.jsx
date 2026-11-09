import { useCallback } from "react"
import { Link, useNavigate, useParams } from "react-router"
import FormularioIniciativa from "../componentes/iniciativas/FormularioIniciativa.jsx"
import EstadoConsulta from "../componentes/participacion/EstadoConsulta.jsx"
import useConsulta from "../hooks/useConsulta.js"
import { actualizarIniciativa, consultarIniciativa, crearIniciativa } from "../servicios/iniciativas.js"

function CrearIniciativa({ usuario }) {
    const navegar = useNavigate()
    return (
        <section className="row justify-content-center py-4">
            <div className="col-12 col-lg-9 col-xl-8">
                <h1 className="mb-4">Registrar iniciativa</h1>
                <FormularioIniciativa
                    guardar={(datos, signal) => crearIniciativa(datos, usuario, { signal })}
                    onGuardado={(iniciativa) => navegar(`/iniciativas/${iniciativa.id}`, { replace: true })}
                    rutaCancelar="/catalogo" />
            </div>
        </section>
    )
}

function EditarIniciativa({ id, usuario }) {
    const navegar = useNavigate()
    const cargar = useCallback((signal) => consultarIniciativa(id, usuario.id, { signal }), [id, usuario.id])
    const consulta = useConsulta(cargar)
    return (
        <section className="row justify-content-center py-4">
            <div className="col-12 col-lg-9 col-xl-8">
                <h1 className="mb-4">Editar iniciativa</h1>
                <EstadoConsulta consulta={consulta}>{(iniciativa) => {
                    if (!iniciativa.permisos.puedeEditar) return (
                        <p className="alert alert-warning" role="alert">
                            La edición está disponible únicamente para el propietario de una iniciativa que no esté archivada.
                        </p>
                    )
                    return <FormularioIniciativa key={iniciativa.id} inicial={iniciativa}
                        guardar={(datos, signal) => actualizarIniciativa(id, datos, usuario, { signal })}
                        onGuardado={() => navegar(`/iniciativas/${id}`, { replace: true })}
                        rutaCancelar={`/iniciativas/${id}`} />
                }}</EstadoConsulta>
                <p className="mt-3"><Link to="/catalogo">Volver al catálogo</Link></p>
            </div>
        </section>
    )
}

function RegistroIniciativa({ usuario }) {
    const { id } = useParams()
    return id
        ? <EditarIniciativa key={`${id}-${usuario.id}`} id={id} usuario={usuario} />
        : <CrearIniciativa key={usuario.id} usuario={usuario} />
}

export default RegistroIniciativa
