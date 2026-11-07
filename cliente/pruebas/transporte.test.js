import test from 'node:test'
import assert from 'node:assert/strict'
import { crearTransporte } from '../src/servicios/participacion/transporte.js'
const entorno = { VITE_API_URL: 'http://localhost:3000/api/' }
const lista = { items: [], total: 0, page: 1, size: 10, totalPages: 1 }

test('transporte usa base configurada y sesión del servidor; no envía identidad simulada', async () => {
  const peticion = crearTransporte({ entorno, fetchImpl: async (url, opciones) => {
    assert.equal(url, 'http://localhost:3000/api/requests')
    assert.equal(opciones.credentials, 'include')
    assert.equal(opciones.usuario, undefined)
    return Response.json(lista)
  } })
  assert.deepEqual(await peticion('/requests', { usuario: { id: 'no-confiable' } }), lista)
})
test('conserva errores de validación por campo y códigos', async () => {
  const peticion = crearTransporte({ entorno, fetchImpl: async () => Response.json({ error: { message: 'Revise', code: 'VALIDATION_ERROR', fields: { nombre: 'Obligatorio' } } }, { status: 400 }) })
  await assert.rejects(peticion('projects'), e => e.estado === 400 && e.campos.nombre === 'Obligatorio')
})
test('maneja 204, respuesta inválida, red y cancelación', async () => {
  const construir = fetchImpl => crearTransporte({ entorno, fetchImpl })
  assert.equal(await construir(async () => new Response(null, { status: 204 }))('initiatives/1/team/2', { method: 'DELETE' }), null)
  await assert.rejects(construir(async () => new Response('<html>'))('requests'), /JSON inválida/)
  await assert.rejects(construir(async () => Response.json({ items: null }))('requests'), /formato inválido/)
  await assert.rejects(construir(async () => { throw new TypeError('red') })('requests'), /conectar/)
  await assert.rejects(construir(async () => { throw new DOMException('abortado', 'AbortError') })('requests'), { name: 'AbortError' })
})
test('producción nunca activa simulación aunque la variable diga true', async () => {
  let llamadas = 0
  await crearTransporte({ entorno: { ...entorno, DEV: false, VITE_PARTICIPACION_MOCK: 'true' }, fetchImpl: async () => { llamadas++; return Response.json(lista) } })('requests')
  assert.equal(llamadas, 1)
  await assert.rejects(crearTransporte({ entorno: {} })('requests'), /VITE_API_URL/)
})
