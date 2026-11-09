import { ContextoCatalogos } from "./useCatalogos.js"
import useConsulta from "../hooks/useConsulta.js"
import EstadoConsulta from "../componentes/participacion/EstadoConsulta.jsx"
import { cargarCatalogos } from "../servicios/catalogos.js"

export default function Catalogos({ children }) {
    const consulta = useConsulta(cargarCatalogos)
    return <EstadoConsulta consulta={consulta}>{datos => (
        <ContextoCatalogos.Provider value={datos}>{children}</ContextoCatalogos.Provider>
    )}</EstadoConsulta>
}
