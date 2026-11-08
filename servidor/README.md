# Servidor de Innovation Hub

API del avance 2: Node.js 22 o superior, Express 5 y MongoDB con replica set. Separacion por responsabilidad: `rutas/` interpreta HTTP, `servicios/` verifica reglas y permisos, `datos/` define modelos y persistencia, `middleware/` resuelve sesion y errores. El cliente existente se conserva.

## Preparar MongoDB

Si tiene Docker instalado, desde una terminal puede iniciar un nodo de desarrollo:

```powershell
docker run -d --name innovation-mongo -p 127.0.0.1:27017:27017 mongo:7.0 --replSet rs0 --bind_ip_all
docker exec innovation-mongo mongosh --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
```

Esperar a que el nodo sea PRIMARY. Comprobar con `docker exec innovation-mongo mongosh --eval 'rs.status().myState'`: debe mostrar 1. Si ya existe ese contenedor, iniciarlo con `docker start innovation-mongo`; no volver a crearlo ni borrar sus datos.

Alternativa con MongoDB Community instalado: crear una carpeta de datos propia, iniciar `mongod --replSet rs0 --dbpath "RUTA_A_SUS_DATOS" --bind_ip 127.0.0.1 --port 27017`, abrir otra terminal y ejecutar `mongosh --eval 'rs.initiate()'`. Mantener el proceso abierto. El proyecto no instala ni modifica servicios de MongoDB automaticamente.

## Instalar, configurar y ejecutar

Desde `D:\Proyecto Progra Web\Innovation-hub`:

```powershell
cd servidor
npm ci
Copy-Item .env.example .env
```

Editar `.env` sin subirlo a Git:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/innovation_hub_demo?replicaSet=rs0
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
SESSION_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES
NODE_ENV=development
```

Generar un secreto propio, por ejemplo con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`, y copiar el resultado a SESSION_SECRET. No usar una contrasena personal como secreto ni colocarla en variables VITE. En produccion configurar HTTPS; las cookies Secure no funcionan sobre HTTP. Detras de un proxy HTTPS se debe configurar explicitamente la confianza del proxy antes de desplegar.

```powershell
npm run dev
```

La API responde en `http://localhost:3000/api/health`. `npm start` ejecuta sin reinicio automatico. El proceso conecta MongoDB y prepara indices antes de abrir el puerto. Si no hay replica set, el arranque explica el requisito y no atiende operaciones sin atomicidad.

## Datos reproducibles y Postman

Usar una base dedicada terminada en `_demo`; nunca una base con informacion que deba conservarse. Configurar en `.env` una variable `SEED_PASSWORD` con una clave de demostracion de 8..128 caracteres que decida el equipo. Despues:

```powershell
npm run seed -- --confirmar-demo
```

Las semillas agregan catalogos y restablecen solo cuentas, iniciativas y solicitudes de IDs reservados `demo-*`. No borran colecciones ni datos ajenos a esas semillas. Si una iniciativa demo ya fue convertida, la carga se detiene para no dejar proyecto y origen inconsistentes; usar una nueva base `_demo` para repetir el recorrido desde cero.

Cuentas, todas con la clave SEED_PASSWORD configurada: `propietario@example.test`, `solicitante@example.test`, `ajeno@example.test`, `miembro@example.test`, `aceptar@example.test`, `rechazar@example.test` y `pendiente@example.test`. Son direcciones ficticias; no se envia correo.

| Variable de Postman | Valor de demostracion |
| --- | --- |
| baseUrl | http://localhost:3000/api |
| iniciativaPublicaId | demo-publica |
| iniciativaPropiaId | demo-propia |
| iniciativaConvertirId | demo-convertir |
| iniciativaSinMiembrosId | demo-sin-miembros |
| propietarioId | demo-propietario |
| miembroRetirableId | demo-miembro |
| solicitudAjenaId | demo-solicitud-ajena |
| solicitudAceptarId / solicitanteAceptarId | demo-solicitud-aceptar / demo-aceptar |
| solicitudRechazarId | demo-solicitud-rechazar |
| solicitudPendienteId | demo-solicitud-pendiente |
| idInexistente | 000000000000000000000000 |

Para `pruebas/participacion.postman_collection.json`, iniciar sesion tres veces en POST `/api/auth/login` con `{correo,contrasena}` usando propietario, solicitante y ajeno. Copiar cada cabecera Set-Cookie solo hasta el primer punto y coma a `cookiePropietario`, `cookieSolicitante` y `cookieAjeno`; formato `innovation.sid=valor`. Conservarlas solo en el entorno local, nunca exportarlas al repositorio. Ejecutar los 38 casos en orden sobre datos nuevos. La coleccion no se modifica.

La coleccion adicional `pruebas/servidor.postman_collection.json` cubre autenticacion, perfiles, catalogos e iniciativas. Configurar su variable local `clavePruebas` con SEED_PASSWORD; su primer login captura la cookie del propietario automaticamente. No exportar el valor de clavePruebas ni la cookie.

## Comprobaciones

```powershell
npm run lint
npm test
```

Lint analiza el codigo sin ejecutarlo; las pruebas de Node usan HTTP, sesiones y un MongoDB 7.0.14 temporal real con replica set. La primera ejecucion descarga el binario de MongoDB (aproximadamente 592 MB en Windows), necesita conexion a Internet y puede tardar. No utiliza ni modifica la base configurada en `.env`. Las siguientes ejecuciones reutilizan el binario descargado.

Las pruebas cubren registro, correo unico, hashing, cierre de sesion e invalidacion de cookies antiguas, perfiles, filtros, cuatro niveles de visibilidad, CRUD y archivo, solicitudes y decisiones, retiros, conversion, permisos, errores y carreras concurrentes. Tambien ejecutan con Newman las colecciones Postman contra el mismo servidor temporal; las cookies permanecen en memoria.

## Conectar con React

En `cliente/.env.local`: `VITE_API_URL=http://localhost:3000/api`, `VITE_PARTICIPACION_MOCK=false`; conservar las demas variables necesarias de GitHub. React envia `credentials: 'include'`. Estos valores por si solos no reemplazan los servicios de autenticacion, perfiles e iniciativas que todavia usan simulacion. La tarea D7 debe conectar esos servicios y las rutas pendientes de App.jsx, ampliar los formularios a las reglas documentadas y usar el logout HTTP real.

La entrada Gustavo conserva su utilidad de desarrollo simulado; el selector «Probar como» no crea sesiones reales. No se considera prueba de entrega cliente-servidor. Este cambio implementa J1-J10 y documenta los ajustes de integracion pendientes sin alterar las pantallas de David y Gustavo.

Consultar `../docs/api-contract.md`, `../docs/modelo-datos.md` y `../docs/guia-servidor-j.md` para conocer formatos, decisiones y recorrido de cada funcionalidad.
