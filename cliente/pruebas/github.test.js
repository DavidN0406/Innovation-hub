import test from 'node:test'
import assert from 'node:assert/strict'
import { crearClienteGitHub } from '../src/servicios/github.js'
const datos = { name: 'hub', owner: { login: 'equipo' }, description: null, language: null, default_branch: 'main', updated_at: '2026-11-07T12:00:00Z', open_issues_count: 0 }
const cliente = fetchImpl => crearClienteGitHub({ baseUrl: 'https://api.github.com', fetchImpl })
const url = 'https://github.com/equipo/hub'

test('extrae los siete datos y codifica ruta sin enviar secretos', async () => {
  const consultar = cliente(async (ruta, opciones) => {
    assert.equal(ruta, 'https://api.github.com/repos/equipo/hub')
    assert.equal(opciones.headers.Authorization, undefined)
    return Response.json(datos)
  })
  const resultado = await consultar(url + '.git')
  assert.equal(Object.keys(resultado).length, 7)
  assert.equal(resultado.asuntosAbiertos, 0)
  assert.equal(resultado.descripcion, null)
})
for (const [status, headers, mensaje] of [[404, {}, /no existe o es privado/], [403, {}, /denegó/], [403, { 'x-ratelimit-remaining': '0' }, /limitó/], [403, { 'retry-after': '60' }, /limitó/], [429, {}, /limitó/], [503, {}, /no está disponible/]]) {
  test(`maneja HTTP ${status} ${JSON.stringify(headers)}`, async () => {
    await assert.rejects(cliente(async () => new Response('', { status, headers }))(url), mensaje)
  })
}
test('rechaza JSON inválido, esquema incompleto y privado', async () => {
  await assert.rejects(cliente(async () => new Response('html'))(url), /JSON inválida/)
  await assert.rejects(cliente(async () => Response.json({ name: 'x' }))(url), /incompletos/)
  await assert.rejects(cliente(async () => Response.json({ ...datos, private: true }))(url), /es privado/)
})
test('rechaza URLs y configuración inválidas antes de llamar fetch', async () => {
  let llamadas = 0
  const fetchImpl = async () => { llamadas++; return Response.json(datos) }
  for (const direccion of ['javascript:alert(1)', 'https://github.com.ejemplo.com/a/b', 'https://github.com/a/b/issues', 'https://user:clave@github.com/a/b'])
    await assert.rejects(cliente(fetchImpl)(direccion), /inválida/)
  await assert.rejects(crearClienteGitHub({ baseUrl: 'https://otro.test', fetchImpl })(url), /configurarse/)
  assert.equal(llamadas, 0)
})
test('maneja red y timeout; permite cancelar al desmontar', async () => {
  await assert.rejects(cliente(async () => { throw new TypeError('red') })(url), /conectar/)
  await assert.rejects(cliente(async () => { throw new DOMException('tiempo', 'TimeoutError') })(url), /demasiado/)
  const control = new AbortController()
  control.abort()
  await assert.rejects(cliente(async (_, opciones) => opciones.signal.throwIfAborted())(url, { signal: control.signal }), { name: 'AbortError' })
})
