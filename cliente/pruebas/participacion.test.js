import test from 'node:test'
import assert from 'node:assert/strict'
import { crearSimulador, personasPrueba } from '../src/servicios/participacion/simulador.js'
const [solicitante, propietaria, miembro, otro] = personasPrueba
const datos = { mensaje: 'Quiero colaborar', competencias: ['React'], disponibilidad: 'Lunes' }
const rechaza = (promesa, estado) => assert.rejects(promesa, error => error.estado === estado)

test('exige sesión y valida paginación y filtros', async () => {
  const api = crearSimulador()
  await rechaza(api('requests'), 401)
  await rechaza(api('requests?page=0', { usuario: solicitante }), 400)
  await rechaza(api('requests?status=inventado', { usuario: solicitante }), 400)
  const vacia = await api('requests?page=90', { usuario: solicitante })
  assert.deepEqual(vacia.items, [])
  assert.equal(vacia.page, 90)
})

test('crear, editar y cancelar; no modifica recursos ajenos ni terminales', async () => {
  const api = crearSimulador()
  await rechaza(api('initiatives/2/requests', { method: 'POST', body: {}, usuario: solicitante }), 400)
  const s = await api('initiatives/2/requests', { method: 'POST', body: datos, usuario: solicitante })
  await rechaza(api('initiatives/2/requests', { method: 'POST', body: datos, usuario: solicitante }), 409)
  await rechaza(api(`requests/${s.id}`, { method: 'PUT', body: datos, usuario: otro }), 403)
  const editada = await api(`requests/${s.id}`, { method: 'PUT', body: { ...datos, mensaje: 'Actualizada' }, usuario: solicitante })
  assert.equal(editada.mensaje, 'Actualizada')
  const cancelada = await api(`requests/${s.id}/status`, { method: 'PATCH', body: { estado: 'cancelada' }, usuario: solicitante })
  assert.equal(cancelada.estado, 'cancelada')
  await rechaza(api(`requests/${s.id}`, { method: 'PUT', body: datos, usuario: solicitante }), 409)
})

test('aceptar incorpora al equipo una sola vez y filtra por propietario', async () => {
  const api = crearSimulador()
  assert.equal((await api('requests?scope=received', { usuario: otro })).total, 0)
  await rechaza(api('requests/solicitud-demo/status', { method: 'PATCH', body: { estado: 'aceptada' }, usuario: otro }), 403)
  await api('requests/solicitud-demo/status', { method: 'PATCH', body: { estado: 'aceptada' }, usuario: propietaria })
  await rechaza(api('requests/solicitud-demo/status', { method: 'PATCH', body: { estado: 'aceptada' }, usuario: propietaria }), 409)
  const equipo = await api('initiatives/1/team', { usuario: propietaria })
  assert.equal(equipo.miembros.filter(m => m.usuarioId === solicitante.id).length, 1)
  equipo.miembros.length = 0
  assert.equal((await api('initiatives/1/team', { usuario: propietaria })).miembros.length, 3)
})

test('retiro autorizado; protege propietario y recursos inexistentes', async () => {
  const api = crearSimulador()
  await rechaza(api('initiatives/1/team/autor-1', { method: 'DELETE', usuario: propietaria }), 409)
  await rechaza(api('initiatives/1/team/miembro-1-2', { method: 'DELETE', usuario: miembro }), 403)
  await rechaza(api('initiatives/1/team/desconocido', { method: 'DELETE', usuario: propietaria }), 404)
  assert.equal(await api('initiatives/1/team/miembro-1-2', { method: 'DELETE', usuario: propietaria }), null)
})

test('conversión requiere otro miembro, valida campos, mantiene origen y evita duplicados', async () => {
  const api = crearSimulador()
  const proyecto = { nombre: 'Proyecto', descripcion: 'Descripción', objetivo: 'Objetivo', fechaInicio: '2026-11-07', estado: 'planificado', repositorio: '' }
  await rechaza(api('initiatives/1/projects', { method: 'POST', body: proyecto, usuario: miembro }), 403)
  await rechaza(api('initiatives/1/projects', { method: 'POST', body: { ...proyecto, fechaInicio: '2026-02-30' }, usuario: propietaria }), 400)
  const creado = await api('initiatives/1/projects', { method: 'POST', body: proyecto, usuario: propietaria })
  assert.equal(creado.iniciativaId, '1')
  assert.equal((await api(`projects/${creado.id}`, { usuario: solicitante })).nombre, 'Proyecto')
  await rechaza(api('initiatives/1/projects', { method: 'POST', body: proyecto, usuario: propietaria }), 409)
  const sinMiembro = crearSimulador()
  await sinMiembro('initiatives/1/team/miembro-1-2', { method: 'DELETE', usuario: propietaria })
  await rechaza(sinMiembro('initiatives/1/projects', { method: 'POST', body: proyecto, usuario: propietaria }), 409)
  await rechaza(api('projects/inexistente', { usuario: propietaria }), 404)
})
