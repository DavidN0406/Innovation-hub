import Pagina from "./componentes/layout/Pagina.jsx"
import Inicio from "./paginas/Inicio.jsx"

// Coloca la página de inicio dentro de la estructura compartida.
function App() {
    return (
        <Pagina>
            <Inicio />
        </Pagina>
    )
}

export default App