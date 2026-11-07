import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { iniciarSesion, registrarUsuario } from "../servicios/autenticacion.js"

function Acceso({ registro = false, onAutenticar }) {
    const navegar = useNavigate()
    const [formulario, setFormulario] = useState({
        nombre: "",
        correo: "",
        contrasena: "",
        confirmacion: ""
    })
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState("")

    function cambiarCampo(evento) {
        const { name, value } = evento.target
        setFormulario((anterior) => ({ ...anterior, [name]: value }))
        setError("")
    }

    async function enviar(evento) {
        evento.preventDefault()
        if (cargando) return
        setError("")

        if (registro && !formulario.nombre.trim()) {
            setError("Escriba su nombre.")
            return
        }

        if (registro && formulario.contrasena !== formulario.confirmacion) {
            setError("Las contraseñas no coinciden.")
            return
        }

        setCargando(true)

        try {
            const usuario = registro
                ? await registrarUsuario(formulario)
                : await iniciarSesion(formulario)

            onAutenticar(usuario)
            navegar("/", { replace: true })
        } catch (error) {
            setError(error.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="row justify-content-center py-4">
            <section className="col-12 col-md-8 col-lg-6">
                <h1 className="mb-4">{registro ? "Crear cuenta" : "Iniciar sesión"}</h1>

                {import.meta.env.DEV && (
                    <p className="alert alert-info">
                        Modo de prueba: use datos ficticios. Las cuentas se borran al recargar.
                    </p>
                )}

                {error && <p className="alert alert-danger" role="alert">{error}</p>}

                <form onSubmit={enviar} className="card card-body" aria-busy={cargando}>
                    <fieldset disabled={cargando}>
                        <legend className="visually-hidden">Datos de acceso</legend>

                        {registro && (
                            <div className="mb-3">
                                <label htmlFor="nombre" className="form-label">Nombre</label>
                                <input id="nombre" name="nombre" type="text"
                                    className="form-control" autoComplete="name" required
                                    value={formulario.nombre} onChange={cambiarCampo} />
                            </div>
                        )}

                        <div className="mb-3">
                            <label htmlFor="correo" className="form-label">Correo electrónico</label>
                            <input id="correo" name="correo" type="email"
                                className="form-control" autoComplete="username" required
                                value={formulario.correo} onChange={cambiarCampo} />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="contrasena" className="form-label">Contraseña</label>
                            <input id="contrasena" name="contrasena" type="password"
                                className="form-control" required
                                minLength={registro ? 8 : undefined}
                                autoComplete={registro ? "new-password" : "current-password"}
                                value={formulario.contrasena} onChange={cambiarCampo} />
                            {registro && <small>Mínimo 8 caracteres.</small>}
                        </div>

                        {registro && (
                            <div className="mb-3">
                                <label htmlFor="confirmacion" className="form-label">Confirmar contraseña</label>
                                <input id="confirmacion" name="confirmacion" type="password"
                                    className="form-control" autoComplete="new-password" required
                                    value={formulario.confirmacion} onChange={cambiarCampo} />
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-100">
                            {cargando ? "Procesando…" : registro ? "Crear cuenta" : "Entrar"}
                        </button>
                    </fieldset>
                </form>

                <p className="mt-3">
                    <Link to={registro ? "/login" : "/registro"}>
                        {registro ? "Ya tengo cuenta: iniciar sesión" : "No tengo cuenta: registrarme"}
                    </Link>
                </p>
            </section>
        </div>
    )
}

export default Acceso
