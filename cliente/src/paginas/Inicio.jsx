import { Link } from "react-router"
import TarjetaInformativa from "../componentes/comunes/TarjetaInformativa.jsx"

const tiposIniciativa = [
    {
        id: "idea",
        titulo: "Ideas",
        descripcion:
            "Una propuesta nueva que busca personas para desarrollarla."
    },
    {
        id: "necesidad",
        titulo: "Necesidades",
        descripcion:
            "Un problema real que alguien quiere resolver con ayuda de otros."
    },
    {
        id: "reto",
        titulo: "Retos",
        descripcion:
            "Una invitación abierta para que un equipo proponga una solución."
    }
]

// Conserva el contenido y el diseño de la página principal del avance 1.
function Inicio() {
    return (
        <>
            <section
                className="hero p-4 p-md-5 mb-5"
                aria-labelledby="titulo-principal"
            >
                <h1 id="titulo-principal" className="display-5">
                    Innovation Hub
                </h1>

                <p className="lead">
                    La plataforma donde la comunidad estudiantil publica
                    y encuentra ideas, necesidades y retos para desarrollar
                    juntos. Propón un proyecto, súmate a uno existente o
                    busca personas con las competencias que tu iniciativa
                    necesita.
                </p>

                <div className="d-flex flex-wrap gap-2">
                    <Link
                        className="btn btn-primary btn-lg"
                        to="/catalogo"
                    >
                        Ver catálogo
                    </Link>

                    <Link
                        className="btn btn-outline-primary btn-lg"
                        to="/iniciativas/nueva"
                    >
                        Publicar una iniciativa
                    </Link>
                </div>
            </section>

            <section
                className="mb-5"
                aria-labelledby="titulo-como-funciona"
            >
                <h2 id="titulo-como-funciona" className="mb-3">
                    ¿Cómo funciona?
                </h2>

                <p>
                    Cada iniciativa se clasifica en uno de tres tipos.
                </p>

                <div className="row g-4">
                    {tiposIniciativa.map(function (tipo) {
                        return (
                            <div
                                className="col-12 col-md-4"
                                key={tipo.id}
                            >
                                <TarjetaInformativa titulo={tipo.titulo}>
                                    <p className="card-text">
                                        {tipo.descripcion}
                                    </p>
                                </TarjetaInformativa>
                            </div>
                        )
                    })}
                </div>
            </section>

            <section className="mb-5" aria-label="Publicar y participar">
                <div className="row g-4">
                    <div className="col-12 col-md-6">
                        <TarjetaInformativa titulo="Cómo publicar una iniciativa">
                            <p className="card-text">
                                Completa el formulario con el título, el tipo,
                                el problema que quieres resolver, las
                                competencias que necesitas y cuántas personas
                                buscas. Tu iniciativa aparece de inmediato
                                en el catálogo.
                            </p>

                            <Link
                                className="btn btn-primary"
                                to="/iniciativas/nueva"
                            >
                                Registrar una iniciativa
                            </Link>
                        </TarjetaInformativa>
                    </div>

                    <div className="col-12 col-md-6">
                        <TarjetaInformativa titulo="Cómo participar en una iniciativa">
                            <p className="card-text">
                                Explora el catálogo, filtra por tipo, categoría
                                o competencia y entra al detalle de la que te
                                interese. Ahí puedes enviar una solicitud
                                para unirte al equipo.
                            </p>

                            <Link
                                className="btn btn-primary"
                                to="/catalogo"
                            >
                                Explorar el catálogo
                            </Link>
                        </TarjetaInformativa>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Inicio