import { Link } from "react-router"

function TarjetaIniciativa({ iniciativa }) {
    const fecha = iniciativa.fechaPublicacion?.split("-").reverse().join("/")

    return (
        <article className="card h-100 tarjeta-iniciativa">
            <div className="card-body">
                <p className="mb-2">
                    <span className="badge text-bg-primary me-1">{iniciativa.tipo}</span>
                    <span className="badge text-bg-secondary">{iniciativa.estado}</span>
                </p>
                <h3 className="h5 card-title">{iniciativa.titulo}</h3>
                <p className="small text-body-secondary mb-2">{iniciativa.categoria}</p>
                <p className="card-text">{iniciativa.resumen}</p>
                {iniciativa.autor && <p className="small mb-1">Publicado por <strong>{iniciativa.autor}</strong></p>}
                {fecha && <p className="small text-body-secondary mb-3">
                    <time dateTime={iniciativa.fechaPublicacion}>{fecha}</time>
                </p>}
                <h4 className="h6">Competencias requeridas</h4>
                {iniciativa.competencias.length === 0 ? (
                    <p className="small mb-0">Sin competencias especificadas.</p>
                ) : (
                    <ul className="list-unstyled d-flex flex-wrap gap-1 mb-0">
                        {iniciativa.competencias.map((competencia) => (
                            <li className="badge text-bg-light border" key={competencia}>{competencia}</li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="card-footer">
                <Link to={`/iniciativas/${iniciativa.id}`} className="btn btn-primary btn-sm"
                    aria-label={`Ver detalle de ${iniciativa.titulo}`}>
                    Ver detalle
                </Link>
            </div>
        </article>
    )
}

export default TarjetaIniciativa
