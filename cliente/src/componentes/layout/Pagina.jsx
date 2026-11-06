import Navbar from "./Navbar.jsx"

// Estructura compartida por las páginas de la aplicación.
function Pagina({ children }) {
    return (
        <>
            <Navbar />

            <main className="container">
                {children}
            </main>

            <footer className="container border-top py-4 mt-5">
                <p className="mb-0 text-body-secondary">
                    Innovation Hub, proyecto del curso SOFT-12
                    Programación web avanzada.
                </p>
            </footer>
        </>
    )
}

export default Pagina