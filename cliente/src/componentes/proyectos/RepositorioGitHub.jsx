import { useCallback } from 'react'
import { consultarRepositorio } from '../../servicios/github.js'
import useConsulta from '../../hooks/useConsulta.js'
import EstadoConsulta from '../participacion/EstadoConsulta.jsx'
import { esRepositorioGitHub } from '../../servicios/participacion/validacion.js'

export default function RepositorioGitHub({ repositorio }) {
  const cargar = useCallback(signal => consultarRepositorio(repositorio, { signal }), [repositorio])
  const consulta = useConsulta(cargar)
  return <section className="border-top pt-3"><h3 className="h5">Información de GitHub</h3>
    <EstadoConsulta consulta={consulta}>{datos => <dl>
      <dt>Nombre</dt><dd>{datos.nombre}</dd><dt>Propietario</dt><dd>{datos.propietario}</dd>
      <dt>Descripción</dt><dd>{datos.descripcion || 'Sin descripción'}</dd>
      <dt>Lenguaje principal</dt><dd>{datos.lenguaje || 'Sin lenguaje identificado'}</dd>
      <dt>Rama principal</dt><dd>{datos.ramaPrincipal}</dd>
      <dt>Última actualización</dt><dd><time dateTime={datos.ultimaActualizacion}>{new Date(datos.ultimaActualizacion).toLocaleString('es-CR')}</time></dd>
      <dt>Asuntos abiertos</dt><dd>{datos.asuntosAbiertos}</dd>
    </dl>}</EstadoConsulta>
    {esRepositorioGitHub(repositorio) && <a href={repositorio} target="_blank" rel="noopener noreferrer">Abrir repositorio en GitHub</a>}
  </section>
}
