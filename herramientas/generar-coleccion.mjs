import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const cookie = actor => actor ? [{ key: 'Cookie', value: `{{cookie${actor}}}`, type: 'text' }] : []
function caso(nombre, method, ruta, status, { actor = 'Propietario', body, guardar, campos = false, comprobar = [] } = {}) {
  const lineas = [
    `pm.test('Código HTTP ${status}', () => pm.response.to.have.status(${status}));`,
    ...(status === 204 ? ["pm.test('Sin contenido', () => pm.expect(pm.response.text()).to.eql(''));"] : [
      "pm.test('Respuesta JSON', () => pm.response.to.be.json);",
      ...(status >= 400 ? ["pm.test('Error uniforme', () => { const e = pm.response.json().error; pm.expect(e.message).to.be.a('string'); pm.expect(e.code).to.be.a('string'); });"] : []),
      ...(campos ? ["pm.test('Errores por campo', () => pm.expect(pm.response.json().error.fields).to.be.an('object'));"] : [])
    ]),
    ...(guardar ? [`if (pm.response.code === ${status}) pm.collectionVariables.set('${guardar}', pm.response.json().id);`] : []),
    ...comprobar
  ]
  return { name: nombre, protocolProfileBehavior: { disableCookies: true },
    request: { method, header: [...cookie(actor), { key: 'Accept', value: 'application/json' }, ...(body ? [{ key: 'Content-Type', value: 'application/json' }] : [])],
      url: `{{baseUrl}}${ruta}`, ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}) },
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: lineas } }]
  }
}
const solicitud = { mensaje: 'Participar en pruebas de integración', competencias: ['React'], disponibilidad: 'Lunes por la tarde' }
const proyecto = { nombre: 'Proyecto de integración', descripcion: 'Proyecto creado desde la colección', objetivo: 'Validar conversión', fechaInicio: '2026-11-07', estado: 'planificado', repositorio: 'https://github.com/DavidN0406/Innovation-hub' }
const grupos = [
  { name: 'Iniciativas: selección para participar', item: [
    caso('Correcta: iniciativas propias paginadas', 'GET', '/initiatives?scope=owned&page=1&size=5', 200),
    caso('Inválida: tamaño cero', 'GET', '/initiatives?scope=owned&size=0', 400),
    caso('Inexistente: equipo de iniciativa desconocida', 'GET', '/initiatives/{{idInexistente}}/team', 404),
    caso('No autorizado: sin sesión', 'GET', '/initiatives?scope=owned', 401, { actor: null })
  ] },
  { name: 'Solicitudes: consulta y validación', item: [
    caso('Correcta: consultar propias', 'GET', '/requests?scope=mine&page=1&size=5', 200, { actor: 'Solicitante' }),
    caso('Correcta: filtrar recibidas', 'GET', '/requests?scope=received&status=pendiente&initiativeId={{iniciativaPropiaId}}', 200),
    caso('Inválida: estado desconocido', 'GET', '/requests?status=inventado', 400),
    caso('Inválida: formulario vacío', 'POST', '/initiatives/{{iniciativaPublicaId}}/requests', 400, { actor: 'Solicitante', body: {}, campos: true }),
    caso('Inexistente: editar solicitud desconocida', 'PUT', '/requests/{{idInexistente}}', 404, { actor: 'Solicitante', body: solicitud }),
    caso('No autorizado: consultar sin sesión', 'GET', '/requests?scope=mine', 401, { actor: null }),
    caso('Prohibida: editar solicitud ajena', 'PUT', '/requests/{{solicitudAjenaId}}', 403, { actor: 'Ajeno', body: solicitud })
  ] },
  { name: 'Solicitudes: crear, editar y cancelar', item: [
    caso('Crear solicitud propia', 'POST', '/initiatives/{{iniciativaPublicaId}}/requests', 201, { actor: 'Solicitante', body: solicitud, guardar: 'solicitudCreadaId' }),
    caso('Conflicto: pendiente duplicada', 'POST', '/initiatives/{{iniciativaPublicaId}}/requests', 409, { actor: 'Solicitante', body: solicitud }),
    caso('Editar pendiente', 'PUT', '/requests/{{solicitudCreadaId}}', 200, { actor: 'Solicitante', body: { ...solicitud, mensaje: 'Motivación actualizada' } }),
    caso('Cancelar pendiente', 'PATCH', '/requests/{{solicitudCreadaId}}/status', 200, { actor: 'Solicitante', body: { estado: 'cancelada' } }),
    caso('Conflicto: editar cancelada', 'PUT', '/requests/{{solicitudCreadaId}}', 409, { actor: 'Solicitante', body: solicitud })
  ] },
  { name: 'Solicitudes: resolución y alta al equipo', item: [
    caso('Aceptar pendiente', 'PATCH', '/requests/{{solicitudAceptarId}}/status', 200, { body: { estado: 'aceptada' } }),
    caso('Comprobar incorporación al equipo', 'GET', '/initiatives/{{iniciativaPropiaId}}/team', 200, { comprobar: ["pm.test('Solicitante incorporado', () => pm.expect(pm.response.json().miembros.some(m => String(m.usuarioId) === pm.collectionVariables.get('solicitanteAceptarId'))).to.eql(true));"] }),
    caso('Conflicto: aceptar dos veces', 'PATCH', '/requests/{{solicitudAceptarId}}/status', 409, { body: { estado: 'aceptada' } }),
    caso('Rechazar otra pendiente', 'PATCH', '/requests/{{solicitudRechazarId}}/status', 200, { body: { estado: 'rechazada' } }),
    caso('Inválida: transición inventada', 'PATCH', '/requests/{{solicitudPendienteId}}/status', 400, { body: { estado: 'inventada' } }),
    caso('Prohibida: resolver como ajeno', 'PATCH', '/requests/{{solicitudPendienteId}}/status', 403, { actor: 'Ajeno', body: { estado: 'aceptada' } })
  ] },
  { name: 'Equipos', item: [
    caso('Correcta: listar equipo', 'GET', '/initiatives/{{iniciativaPropiaId}}/team', 200),
    caso('Inválida: retirar al propietario', 'DELETE', '/initiatives/{{iniciativaPropiaId}}/team/{{propietarioId}}', 409),
    caso('Inexistente: retirar miembro desconocido', 'DELETE', '/initiatives/{{iniciativaPropiaId}}/team/{{idInexistente}}', 404),
    caso('No autorizado: retirar sin sesión', 'DELETE', '/initiatives/{{iniciativaPropiaId}}/team/{{miembroRetirableId}}', 401, { actor: null }),
    caso('Prohibida: retirar como ajeno', 'DELETE', '/initiatives/{{iniciativaPropiaId}}/team/{{miembroRetirableId}}', 403, { actor: 'Ajeno' }),
    caso('Correcta: retirar integrante', 'DELETE', '/initiatives/{{iniciativaPropiaId}}/team/{{miembroRetirableId}}', 204)
  ] },
  { name: 'Proyectos', item: [
    caso('Correcta: listar accesibles', 'GET', '/projects?page=1&size=5', 200),
    caso('Inválida: paginación', 'GET', '/projects?page=0', 400),
    caso('Inválida: formulario', 'POST', '/initiatives/{{iniciativaConvertirId}}/projects', 400, { body: { ...proyecto, nombre: '', fechaInicio: '2026-02-30' }, campos: true }),
    caso('Inexistente: detalle', 'GET', '/projects/{{idInexistente}}', 404),
    caso('No autorizado: sin sesión', 'GET', '/projects', 401, { actor: null }),
    caso('Prohibida: conversión como ajeno', 'POST', '/initiatives/{{iniciativaConvertirId}}/projects', 403, { actor: 'Ajeno', body: proyecto }),
    caso('RN-09: sin otro miembro', 'POST', '/initiatives/{{iniciativaSinMiembrosId}}/projects', 409, { body: proyecto }),
    caso('Correcta: convertir', 'POST', '/initiatives/{{iniciativaConvertirId}}/projects', 201, { body: proyecto, guardar: 'proyectoCreadoId' }),
    caso('Correcta: consultar y conservar origen', 'GET', '/projects/{{proyectoCreadoId}}', 200, { comprobar: ["pm.test('Mantiene origen', () => pm.expect(String(pm.response.json().iniciativaId)).to.eql(pm.collectionVariables.get('iniciativaConvertirId')));"] }),
    caso('Conflicto: conversión duplicada', 'POST', '/initiatives/{{iniciativaConvertirId}}/projects', 409, { body: proyecto })
  ] }
]
const variables = ['cookiePropietario', 'cookieSolicitante', 'cookieAjeno', 'iniciativaPublicaId', 'iniciativaPropiaId', 'iniciativaConvertirId', 'iniciativaSinMiembrosId', 'propietarioId', 'miembroRetirableId', 'solicitudAjenaId', 'solicitudAceptarId', 'solicitudRechazarId', 'solicitudPendienteId', 'solicitanteAceptarId', 'solicitudCreadaId', 'proyectoCreadoId']
const coleccion = {
  info: { name: 'Innovation Hub - Participación (propuesta G8)', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', description: 'Contrato propuesto en docs/api-participacion-propuesta.md. Preparar datos y sesiones según pruebas/README.md. Ejecutar sobre base de pruebas: modifica solicitudes/equipos/proyectos. No se ha ejecutado contra un servidor real.' },
  variable: [{ key: 'baseUrl', value: 'http://localhost:3000/api' }, { key: 'idInexistente', value: '000000000000000000000000' }, ...variables.map(key => ({ key, value: '' }))], item: grupos
}
writeFileSync(fileURLToPath(new URL('../pruebas/participacion.postman_collection.json', import.meta.url)), JSON.stringify(coleccion, null, 2) + '\n')
console.log(`${grupos.reduce((n, g) => n + g.item.length, 0)} casos generados.`)
