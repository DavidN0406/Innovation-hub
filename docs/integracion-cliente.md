# D7 — Integrar el cliente con la API real

Base de preparación: `9fa19f6`, con los diez commits de Jorge y los nueve de Gustavo en main. Este cambio completa la conexión del cliente; el recorrido real en el navegador debe comprobarse antes de confirmar la entrega.

## Aplicar los archivos

1. Desde la raíz de Innovation-hub, compruebe `git status` y actualice con `git pull origin main`. Si tiene cambios propios pendientes, consérvelos antes de copiar.
2. Extraiga el ZIP en una carpeta aparte. Copie su contenido sobre la raíz del repositorio, donde están `cliente`, `servidor`, `docs` y `README.md`. Combine las carpetas y reemplace los archivos coincidentes. No elimine las carpetas originales y no copie el ZIP dentro de `cliente`.
3. El paquete contiene archivos completos modificados y nuevos. No incluye `.env`, credenciales, dependencias ni compilaciones. No cambia la lógica del servidor ni el Avance 1.

## Preparar el servidor por primera vez

Use Node 24 LTS o una versión compatible con las dependencias (mínimo 22.22.0 para el cliente). MongoDB debe estar en modo replica set. Si todavía no lo tiene, siga «Preparar MongoDB» en [servidor/README.md](../servidor/README.md); esa sección ofrece Docker y MongoDB Community. MongoDB Compass por sí solo no inicia el servidor de base de datos.

En una terminal PowerShell, desde la raíz:

```powershell
cd servidor
npm ci
# Solo si todavía no existe .env:
Copy-Item .env.example .env
```

Para una demostración nueva use una base vacía dedicada, por ejemplo:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/innovation_hub_integracion_demo?replicaSet=rs0
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
SESSION_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO
NODE_ENV=development
SEED_PASSWORD=REEMPLAZAR_POR_UNA_CLAVE_FICTICIA_DE_8_A_128_CARACTERES
```

Genere su SESSION_SECRET (al menos 32 caracteres) con:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copie el resultado a `.env`. Sustituya también SEED_PASSWORD por una clave de pruebas elegida por usted. Estos valores son privados del servidor: no deben ir en archivos VITE ni en Git.

Sobre esa base nueva de demostración, cargue los catálogos y las cuentas ficticias una vez:

```powershell
npm run seed -- --confirmar-demo
npm run dev
```

Si su base ya está preparada, no vuelva a cargar semillas ni reemplace su `.env`: basta con iniciar el servidor. El comando de semillas restablece los registros demo y no debe usarse sobre datos que quiera conservar. No se ejecuta automáticamente al instalar este commit.

Compruebe `http://localhost:3000/api/health`: debe responder `{"estado":"ok"}`. Mantenga esta terminal abierta.

## Preparar el cliente

En otra terminal, desde la raíz:

```powershell
cd cliente
npm ci
```

Cree o edite `cliente/.env.local`, conservando otras variables que necesite:

```dotenv
VITE_API_URL=http://localhost:3000/api
VITE_PARTICIPACION_MOCK=false
VITE_GITHUB_API_URL=https://api.github.com
```

```powershell
npm run dev -- --port 5173 --strictPort
```

Abra `http://localhost:5173`. Use `localhost` para ambas aplicaciones; no mezcle `127.0.0.1` con `localhost`. Si usa otro puerto, cambie también CLIENT_ORIGIN y reinicie el servidor. Reinicie Vite después de editar `.env.local`.

La sesión se recupera con GET `/auth/me`; un 401 significa visitante. Otros errores muestran «Reintentar» y no se confunden con una sesión cerrada. Cerrar sesión ejecuta POST `/auth/logout`; si falla la conexión se conserva el usuario y se muestra el error. Los datos se guardan mediante la API en MongoDB.

## Recorrido antes del commit

1. Registre una cuenta con nombre, primer apellido, correo, contraseña y confirmación, tipo de miembro, carrera y aceptación de términos. Recargue: debe seguir autenticado.
2. Edite su perfil y competencias. Recargue y compruebe que persisten. Busque usuarios con filtros y cambie de página.
3. Cree una iniciativa pública, complete el formulario y deje al menos dos cupos contando al propietario. Modifique el título y recargue. Pruebe los filtros de catálogo.
4. Abra una ventana privada (o un navegador distinto) para registrar una segunda cuenta. Dos pestañas normales comparten la sesión. Desde la segunda cuenta solicite participar con una competencia del catálogo.
5. Regrese a la cuenta propietaria y abra «Solicitudes recibidas». Acepte la solicitud. En «Ver equipo» debe aparecer el otro integrante una sola vez.
6. Con el propietario, convierta la iniciativa en proyecto. Complete los campos y, opcionalmente, el repositorio `https://github.com/DavidN0406/Innovation-hub`. Compruebe listado, detalle, origen y los siete datos de GitHub. Un error de GitHub debe mostrar un mensaje sin impedir ver el proyecto.
7. Con iniciativas separadas, pruebe los cuatro niveles: pública para visitantes; institucional para autenticados; restringida con solo resumen para un usuario ajeno autenticado; privada solo para propietario/equipo. El catálogo restringido no debe fallar por ausencia de autor o fecha.
8. Cree una iniciativa desechable sin relaciones y elimínela: debe desaparecer. Elimine otra con historial: el servidor debe archivarla. «Solo mis iniciativas» y estado «Archivada» permiten consultarla. El botón de archivo explícito siempre conserva los datos.
9. Cierre sesión, recargue e intente una ruta privada: debe volver al login. Compruebe también contraseña incorrecta, correo duplicado, lista vacía y API apagada/reiniciada.

Como alternativa al registro manual inicial, las semillas crean `propietario@example.test`, `solicitante@example.test` y otras cuentas detalladas en la guía del servidor. Todas usan la SEED_PASSWORD que configuró usted. El registro nuevo sigue formando parte de la comprobación.

## Verificación automática y límites

Desde `cliente/`:

```powershell
npm test
npm run lint
npm run build
npm run build:gustavo
```

Resultado al preparar este paquete: 22 pruebas aprobadas, análisis estático sin advertencias y ambas compilaciones correctas. Se comprobó además el renderizado de la tarjeta restringida y los campos del registro. Las nuevas pruebas ejecutan los servicios del cliente con respuestas HTTP controladas; no acreditan persistencia MongoDB ni sustituyen el recorrido visual. Continúan los avisos de deprecación de Sass/Bootstrap ya existentes.

Desde `servidor/`: `npm run lint` y `npm test`. Las pruebas del servidor arrancan MongoDB temporal y no usan la base `.env`. En el entorno de preparación el arranque de ese proceso quedó bloqueado por `Operation not permitted`; no se afirma que esas pruebas hayan pasado aquí. El informe histórico de Jorge registra sus resultados por separado.

## Confirmar el único commit

Una vez que los comandos y el recorrido funcionen, desde la raíz:

```powershell
git status
git diff --stat
git add cliente README.md docs/api-contract.md docs/integracion-cliente.md
git diff --cached --stat
git commit -m "Integrar el cliente con la API real"
git push origin main
```

Revise que el área preparada contenga únicamente los archivos de esta integración. No incluya `.env`, cookies ni claves. No se crea automáticamente una etiqueta de entrega: primero el equipo verifica la aplicación completa.

## Qué cambió

- Servicios HTTP para autenticación, perfiles, catálogos e iniciativas, con cookies, errores por campo, filtros y paginación del contrato.
- Restauración de sesión, logout real, rutas protegidas y navegación a solicitudes, equipos y proyectos.
- Formularios ajustados a los campos, catálogos y cuatro visibilidades de la API; eliminación o archivo según la respuesta del servidor.
- Consulta de competencias/categorías desde MongoDB para usuarios autenticados. El catálogo público permite escribir sus nombres exactos porque esos endpoints de catálogos requieren sesión.
- La simulación de participación solo se habilita en la entrada independiente de Gustavo en desarrollo. Una variable antigua no activa mocks en la aplicación principal. Los archivos históricos de demostración se conservan; no sirven como datos de la entrega real.

La demo independiente puede seguir abriéndose con `npm run dev:gustavo` y su configuración de prueba. No crea sesiones reales. Use la aplicación principal para defender y comprobar el Avance 2 integrado.
