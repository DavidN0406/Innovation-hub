import { Link } from "react-router"

// Se muestra cuando la dirección no coincide con ninguna ruta.
function NoEncontrada() {
    return (
        <section className="text-center py-5">
            <h1>Página no encontrada</h1>

            <p>
                La dirección que ingresó no existe.
            </p>

            <Link className="btn btn-primary" to="/">
                Volver al inicio
            </Link>
        </section>
    )
}

export default NoEncontrada