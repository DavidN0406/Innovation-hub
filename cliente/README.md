# Cliente React de Innovation Hub

Instalación, variables y ejecución: [README del repositorio](../README.md).

- `npm ci`: instalar las versiones del archivo de bloqueo.
- `npm run dev`: aplicación principal, sin cambios de navegación de Gustavo.
- `npm run dev:gustavo`: entrada independiente `/gustavo.html`; copiar `.env.gustavo.example` a `.env.local` para activar la simulación en desarrollo.
- `npm test`: pruebas de servicios, validación, transporte y fallos de GitHub.
- `npm run lint`: revisión del código.
- `npm run build` / `npm run build:gustavo`: comprobar ambas entradas.

[Integrar las pantallas con la sesión y el contrato del equipo](../docs/integracion-gustavo.md). El servidor no está implementado todavía; el modo simulado no persiste en MongoDB y la entrada independiente no reemplaza el login real.
