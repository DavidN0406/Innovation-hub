# Integración del trabajo de Gustavo

## Qué está implementado

Servicios HTTP, simulación aislada, solicitudes propias/recibidas, equipo, conversión, proyectos, consumo público de GitHub y colección Postman. Los estilos son los Sass/Bootstrap existentes. Las pantallas están en `cliente/src/paginas/`, los componentes reutilizados en `componentes/participacion/` y `componentes/proyectos/`, y los servicios en `servicios/`.

La vista `gustavo.html` usa HashRouter para aislar las rutas de desarrollo de la aplicación principal. No modifica `App.jsx`, `main.jsx`, Navbar ni servicios del otro integrante. La simulación se activa **solo** cuando Vite está en desarrollo y `VITE_PARTICIPACION_MOCK=true`; vive en memoria y se reinicia al recargar.

## Integrar las pantallas en App.jsx (responsable de integración)

Reemplazar los placeholders correspondientes y pasar el usuario de la sesión existente a cada pantalla. No agregar otro BrowserRouter ni montar `RutasGustavo` dentro de un `<Routes>` existente: ese componente contiene sus propias rutas y sirve como referencia para la vista independiente.

| Ruta | Componente | Prop |
| --- | --- | --- |
| `/mis-solicitudes` | MisSolicitudes | usuario |
| `/solicitudes/nueva` | NuevaSolicitud | usuario |
| `/iniciativas/:id/solicitar` | NuevaSolicitud | usuario |
| `/solicitudes-recibidas` | SolicitudesRecibidas | usuario |
| `/iniciativas/:id/equipo` | EquipoIniciativa | usuario |
| `/iniciativas/:id/convertir` | ConvertirProyecto | usuario |
| `/proyectos` | Proyectos | usuario |
| `/proyectos/:id` | DetalleProyecto | usuario |

Proteger rutas con la sesión real, añadir enlaces de solicitudes y proyectos al menú y desmontar el contenido al cambiar/cerrar sesión (`key={usuario.id}` en la región protegida). La API debe rechazar operaciones no autorizadas aunque el cliente oculte los botones.

## Integración con el servidor

1. Comparar `api-participacion-propuesta.md` con el contrato acordado. Confirmar nombres de campos, estados, paginación, autenticación, RN completas y cuatro niveles de visibilidad. La propuesta no sustituye el contrato congelado.
2. Implementar o adaptar las rutas en el servidor Express, incluida la validación por campo. La aceptación y el alta al equipo deben ser una sola operación atómica. La conversión debe verificar otro integrante y tener unicidad por iniciativa.
3. Configurar `VITE_API_URL` con la base incluyendo `/api`, `VITE_PARTICIPACION_MOCK=false`, `VITE_GITHUB_API_URL=https://api.github.com`. Nunca poner tokens de GitHub en variables `VITE_*`.
4. La propuesta de autenticación utiliza cookie HttpOnly con `credentials: include`. Confirmar mecanismo con el equipo; si difiere, adaptar el transporte antes de congelar. El parámetro `usuario` solo selecciona actor en la simulación: no viaja a la API real.
5. Completar la colección general con usuarios/autenticación/competencias e iniciativas CRUD, cargar semillas y ejecutar Postman. Se entregan 38 casos de participación como base.

## Datos de demostración

En `gustavo.html`, probar como Ana Solís (solicitante): existe una solicitud pendiente para iniciativa 1. Ana Rojas (propietaria) puede resolverla; Diego Salas ya integra ese equipo. Bruno Mora es otro usuario para probar permisos. Las identidades provienen de los datos existentes del repositorio y no son credenciales reales.

Flujo: editar solicitud como solicitante → aceptar como propietaria → consultar equipo → retirar a Diego → convertir (Ana Solís permanece como integrante adicional) → consultar detalle y listado del proyecto. Para GitHub puede asociarse el repositorio público del proyecto. Recargar reinicia la demostración.

## Cómo explicar la implementación

- `useConsulta`: cancela lecturas anteriores y descarta respuestas obsoletas; al cambiar filtros, usuario o identificador presenta carga y no datos anteriores.
- `useOperacion`: bloquea envíos repetidos y evita actualizar pantallas desmontadas. Una escritura cancelada en el navegador puede haber llegado al servidor: al volver se consulta de nuevo.
- Formularios: valores controlados, errores locales y errores por campo de la API. La validación React no sustituye las reglas del servidor.
- Transporte: URL desde entorno, cookie de sesión, códigos de error, JSON y estructura de respuesta; no envía IDs como autenticación.
- Simulador: copia de datos con cambios inmutables, transiciones terminales, chequeos de propiedad y duplicados. Sirve para desarrollo; no es persistencia MongoDB ni seguridad real.
- GitHub: consulta desde React, siete datos, valores nulos legítimos y fallos controlados; 404 puede significar privado o inexistente. Referencias oficiales: [repositorios](https://docs.github.com/en/rest/repos/repos#get-a-repository), [límites](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).
