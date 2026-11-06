import { Link, useParams } from "react-router"

// Pantalla temporal para comprobar las rutas durante el desarrollo.
function PaginaPendiente({ titulo }) {
    const { id } = useParams()

    return (
        <section className="mb-5">
            <h1 className="h2">{titulo}</h1>

            <p>
                Esta sección se implementará en los próximos commits.
            </p>

            {id && (
                <p>
                    Identificador recibido: <strong>{id}</strong>
                </p>
            )}

            <Link className="btn btn-outline-primary" to="/">
                Volver al inicio
            </Link>
        </section>
    )
}

export default PaginaPendiente