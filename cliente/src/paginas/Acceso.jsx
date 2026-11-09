import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { iniciarSesion, registrarUsuario } from "../servicios/autenticacion.js"
import useOperacion from "../hooks/useOperacion.js"
import ErrorOperacion from "../componentes/participacion/ErrorOperacion.jsx"

export default function Acceso({ registro = false, onAutenticar }) {
    const navegar = useNavigate()
    const operacion = useOperacion()
    const [error, setError] = useState("")
    const [datos, setDatos] = useState({ nombre: "", primerApellido: "", segundoApellido: "", correo: "",
        contrasena: "", confirmacionContrasena: "", tipoMiembro: "estudiante", carrera: "", aceptaTerminos: false })
    function cambiar(e) {
        const { name, value, type, checked } = e.target
        setDatos(actual => ({ ...actual, [name]: type === "checkbox" ? checked : value }))
        setError("")
        operacion.limpiarError()
    }
    function enviar(e) {
        e.preventDefault()
        if (registro && datos.contrasena !== datos.confirmacionContrasena) {
            setError("Las contraseñas deben coincidir.")
            return
        }
        operacion.ejecutar(signal => registro ? registrarUsuario(datos, { signal }) : iniciarSesion(datos, { signal }), usuario => {
            onAutenticar(usuario)
            navegar("/", { replace: true })
        })
    }
    const campos = [
        ...(registro ? [["nombre", "Nombre", "text", 100, "given-name"], ["primerApellido", "Primer apellido", "text", 100, "family-name"],
            ["segundoApellido", "Segundo apellido (opcional)", "text", 100, "additional-name"], ["carrera", "Carrera o área", "text", 150, "off"]] : []),
        ["correo", "Correo electrónico", "email", 254, "username"],
        ["contrasena", "Contraseña", "password", 128, registro ? "new-password" : "current-password"],
        ...(registro ? [["confirmacionContrasena", "Confirmar contraseña", "password", 128, "new-password"]] : [])
    ]
    return <div className="row justify-content-center py-4"><section className="col-12 col-md-8 col-lg-6">
        <h1 className="mb-4">{registro ? "Crear cuenta" : "Iniciar sesión"}</h1>
        <ErrorOperacion error={operacion.error} />
        {error && <p className="alert alert-danger" role="alert">{error}</p>}
        <form className="card card-body" onSubmit={enviar} aria-busy={operacion.ocupado}>
            <fieldset disabled={operacion.ocupado}>
                <legend className="visually-hidden">Datos de acceso</legend>
                {campos.map(([campo, etiqueta, tipo, maximo, completar]) => <div className="mb-3" key={campo}>
                    <label htmlFor={`acceso-${campo}`} className="form-label">{etiqueta}</label>
                    <input id={`acceso-${campo}`} name={campo} type={tipo} className="form-control" value={datos[campo]}
                        onChange={cambiar} required={campo !== "segundoApellido"} maxLength={maximo}
                        minLength={tipo === "password" ? 8 : undefined} autoComplete={completar}
                        aria-invalid={Boolean(operacion.error?.campos?.[campo])} />
                </div>)}
                {registro && <>
                    <label htmlFor="tipoMiembro" className="form-label">Tipo de miembro</label>
                    <select id="tipoMiembro" name="tipoMiembro" className="form-select mb-3" value={datos.tipoMiembro} onChange={cambiar}>
                        <option value="estudiante">Estudiante</option><option value="docente">Docente</option>
                        <option value="administrativo">Administrativo</option>
                    </select>
                    <div className="form-check mb-3">
                        <input id="aceptaTerminos" name="aceptaTerminos" type="checkbox" className="form-check-input" required
                            checked={datos.aceptaTerminos} onChange={cambiar} />
                        <label htmlFor="aceptaTerminos" className="form-check-label">Acepto los términos de uso de Innovation Hub.</label>
                    </div>
                </>}
                <button className="btn btn-primary w-100" type="submit">{operacion.ocupado ? "Procesando…" : registro ? "Crear cuenta" : "Entrar"}</button>
            </fieldset>
        </form>
        <p className="mt-3"><Link to={registro ? "/login" : "/registro"}>{registro ? "Ya tengo cuenta: iniciar sesión" : "No tengo cuenta: registrarme"}</Link></p>
    </section></div>
}
