// Recibe un título y el contenido que se coloca dentro de la tarjeta.
function TarjetaInformativa({ titulo, children }) {
    return (
        <article className="card h-100">
            <div className="card-body">
                <h3 className="h5 card-title">
                    {titulo}
                </h3>

                {children}
            </div>
        </article>
    )
}

export default TarjetaInformativa