import { esRepositorioGitHub } from './participacion/validacion.js'

export function crearClienteGitHub({ baseUrl, fetchImpl = fetch, timeoutMs = 10000 }) {
  return async function consultar(repositorio, { signal } = {}) {
    if (!esRepositorioGitHub(repositorio)) throw new Error('La dirección del repositorio de GitHub es inválida.')
    let base
    try { base = new URL(baseUrl) } catch { throw new Error('Configure VITE_GITHUB_API_URL con https://api.github.com.') }
    if (base.origin !== 'https://api.github.com' || base.pathname !== '/' || base.search || base.hash || base.username || base.password)
      throw new Error('La API pública de GitHub debe configurarse como https://api.github.com.')
    const [propietario, nombre] = new URL(repositorio).pathname.split('/').filter(Boolean)
    const url = `${base.origin}/repos/${encodeURIComponent(propietario)}/${encodeURIComponent(nombre.replace(/\.git$/, ''))}`
    let respuesta
    try {
      respuesta = await fetchImpl(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/vnd.github+json' } })
    } catch (error) {
      if (signal?.aborted) throw error
      throw new Error(error.name === 'TimeoutError' ? 'GitHub tardó demasiado en responder. Intente de nuevo.' : 'No se pudo conectar con GitHub. Revise su conexión e intente de nuevo.')
    }
    if (respuesta.status === 404) throw new Error('El repositorio no existe o es privado. La API pública no permite distinguir ambos casos.')
    if (respuesta.status === 429 || (respuesta.status === 403 && (respuesta.headers.get('x-ratelimit-remaining') === '0' || respuesta.headers.get('retry-after'))))
      throw new Error('GitHub limitó las solicitudes. Espere antes de reintentar.')
    if (respuesta.status === 403) throw new Error('GitHub denegó el acceso o aplicó un límite temporal. Intente más tarde.')
    if (respuesta.status >= 500) throw new Error('El servicio de GitHub no está disponible. Intente más tarde.')
    if (!respuesta.ok) throw new Error(`No se pudo consultar GitHub (${respuesta.status}).`)
    let datos
    try { datos = await respuesta.json() } catch { throw new Error('GitHub devolvió una respuesta JSON inválida.') }
    if (datos?.private === true) throw new Error('El repositorio es privado y no está disponible mediante esta consulta pública.')
    if (!datos || typeof datos.name !== 'string' || !datos.name ||
        typeof datos.owner?.login !== 'string' || !datos.owner.login ||
        !(datos.description === null || typeof datos.description === 'string') ||
        !(datos.language === null || typeof datos.language === 'string') ||
        typeof datos.default_branch !== 'string' || !datos.default_branch ||
        typeof datos.updated_at !== 'string' || !Number.isFinite(Date.parse(datos.updated_at)) ||
        !Number.isInteger(datos.open_issues_count) || datos.open_issues_count < 0)
      throw new Error('GitHub devolvió datos incompletos o con un formato inválido.')
    return {
      nombre: datos.name, propietario: datos.owner.login, descripcion: datos.description,
      lenguaje: datos.language, ramaPrincipal: datos.default_branch,
      ultimaActualizacion: datos.updated_at, asuntosAbiertos: datos.open_issues_count
    }
  }
}

export const consultarRepositorio = crearClienteGitHub({ baseUrl: (import.meta.env ?? {}).VITE_GITHUB_API_URL })
