import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { crearClienteApi } from '../src/servicios/api.js'
import { crearTransporte } from '../src/servicios/participacion/transporte.js'

// Se ejecutan los servicios del cliente con respuestas HTTP controladas.
// No sustituye la prueba de Express/MongoDB ni el recorrido en navegador.
test('D7: sesión, filtros y escrituras usan el contrato real', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false },
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3000/api') } })
  const original = globalThis.fetch
  const llamadas = []
  let respuesta = { id: 'u-1' }, estado = 200
  globalThis.fetch = async (url, opciones) => {
    llamadas.push({ url: new URL(url), opciones })
    assert.equal(opciones.credentials, 'include')
    return estado === 204 ? new Response(null, { status: 204 }) : Response.json(respuesta, { status: estado })
  }
  try {
    const auth = await vite.ssrLoadModule('/src/servicios/autenticacion.js')
    const usuarios = await vite.ssrLoadModule('/src/servicios/usuarios.js')
    const iniciativas = await vite.ssrLoadModule('/src/servicios/iniciativas.js')
    const catalogos = await vite.ssrLoadModule('/src/servicios/catalogos.js')
    const ultima = () => llamadas.at(-1)
    const registro = { nombre: 'Cuenta', primerApellido: 'Prueba', correo: 'cuenta@example.test', contrasena: 'Solo-prueba-123',
      confirmacionContrasena: 'Solo-prueba-123', tipoMiembro: 'estudiante', carrera: 'Software', aceptaTerminos: true }
    await auth.registrarUsuario(registro)
    assert.equal(ultima().url.pathname, '/api/auth/register')
    assert.deepEqual(JSON.parse(ultima().opciones.body), registro)
    await auth.iniciarSesion({ ...registro, id: 'otro-usuario' })
    assert.deepEqual(JSON.parse(ultima().opciones.body), { correo: registro.correo, contrasena: registro.contrasena })
    assert.deepEqual(await auth.consultarSesion(), respuesta)
    estado = 401; respuesta = { error: { message: 'Sesión vencida', fields: {} } }
    assert.equal(await auth.consultarSesion(), null)
    await auth.cerrarSesion()
    estado = 500
    await assert.rejects(auth.consultarSesion(), e => e.estado === 500)
    await assert.rejects(auth.cerrarSesion(), e => e.estado === 500)
    estado = 204
    await auth.cerrarSesion()
    assert.equal(ultima().url.pathname, '/api/auth/logout')
    assert.equal(ultima().opciones.method, 'POST')
    estado = 200; respuesta = { items: [], total: 0, page: 2, size: 3, totalPages: 1 }
    const pagina = await usuarios.buscarUsuarios({ nombre: 'Ana & José', disponibilidad: 'no', pagina: 2 })
    assert.equal(ultima().url.searchParams.get('q'), 'Ana & José')
    assert.equal(ultima().url.searchParams.get('available'), 'false')
    assert.equal(pagina.pagina, 2)
    await usuarios.consultarPerfil('con/segmento')
    assert.ok(ultima().url.pathname.endsWith('con%2Fsegmento'))
    const perfil = { nombre: 'Ana', carrera: 'Software', disponible: false, competencias: ['React'], intereses: [] }
    await usuarios.actualizarPerfil('u-1', perfil)
    assert.equal(ultima().opciones.method, 'PUT')
    assert.deepEqual(JSON.parse(ultima().opciones.body), perfil)
    const lista = await iniciativas.buscarIniciativas({ soloPropias: true, estado: 'Archivada', espacios: 'false', pagina: 2 }, { usuarioId: 'falso' })
    assert.equal(ultima().url.searchParams.get('scope'), 'owned')
    assert.equal(ultima().url.searchParams.get('status'), 'Archivada')
    assert.equal(ultima().url.searchParams.get('spaces'), 'false')
    assert.equal(ultima().url.searchParams.has('usuarioId'), false)
    assert.deepEqual(lista, { iniciativas: [], total: 0, pagina: 2, totalPaginas: 1 })
    const datos = { titulo: 'Título de prueba', tipo: 'Idea', categoria: 'Tecnología', resumen: 'Resumen de la iniciativa de prueba',
      descripcion: 'Descripción suficientemente larga de la iniciativa.', problema: 'Problema que queremos resolver.', beneficiarios: 'Estudiantes',
      participantesEstimados: 3, visibilidad: 'privada', competencias: ['React'], etiquetas: ['web'], propietarioId: 'falso', equipo: [] }
    await iniciativas.crearIniciativa(datos, { id: 'falso' })
    const cuerpo = JSON.parse(ultima().opciones.body)
    assert.equal(cuerpo.propietarioId, undefined)
    assert.equal(cuerpo.equipo, undefined)
    assert.equal(cuerpo.visibilidad, 'privada')
    await iniciativas.actualizarIniciativa('i-1', datos, { id: 'falso' })
    assert.equal(ultima().opciones.method, 'PUT')
    respuesta = { accion: 'archivada', id: 'i-1' }
    assert.deepEqual(await iniciativas.eliminarIniciativa('i-1'), respuesta)
    await iniciativas.archivarIniciativa('i-1')
    assert.equal(ultima().url.pathname, '/api/initiatives/i-1/archive')
    estado = 204
    assert.equal(await iniciativas.eliminarIniciativa('i-1'), null)
    estado = 200; respuesta = { items: [{ nombre: 'React' }], totalPages: 2 }
    const antes = llamadas.length
    await catalogos.cargarCatalogos()
    assert.equal(llamadas.length - antes, 4)
    assert.ok(llamadas.slice(antes).some(c => c.url.searchParams.get('page') === '2'))
  } finally { globalThis.fetch = original; await vite.close() }
})

test('D7: errores por campo, red y cancelación', async () => {
  const api = fetchImpl => crearClienteApi({ urlBase: 'http://localhost:3000/api', fetchImpl })
  await assert.rejects(api(async () => Response.json({ error: { message: 'Revise', fields: { correo: 'Inválido' } } }, { status: 400 }))('auth/register'),
    e => e.estado === 400 && e.campos.correo === 'Inválido')
  await assert.rejects(api(async () => { throw new TypeError('red') })('users'), /conectar/)
  await assert.rejects(api(async () => { throw new DOMException('cancelado', 'AbortError') })('users'), { name: 'AbortError' })
  await assert.rejects(api(async () => new Response('<html>'))('users'), /JSON/)
})

test('D7: la aplicación principal ignora una variable antigua de simulación', async () => {
  let llamadas = 0
  const transporte = crearTransporte({ entorno: { DEV: true, VITE_PARTICIPACION_MOCK: 'true', VITE_API_URL: 'http://localhost:3000/api' },
    fetchImpl: async () => { llamadas++; return Response.json({ items: [], total: 0, page: 1, size: 5, totalPages: 1 }) } })
  await transporte('requests', { usuario: { id: 'falso' } })
  assert.equal(llamadas, 1)
})
