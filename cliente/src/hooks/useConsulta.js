import { useCallback, useEffect, useState } from 'react'

export default function useConsulta(cargar) {
  const [revision, setRevision] = useState(0)
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null })
  const recargar = useCallback(() => setRevision(valor => valor + 1), [])
  useEffect(() => {
    const control = new AbortController()
    Promise.resolve().then(() => cargar(control.signal))
      .then(datos => { if (!control.signal.aborted) setEstado({ datos, cargando: false, error: null, cargar, revision }) })
      .catch(error => { if (!control.signal.aborted) setEstado({ datos: null, cargando: false, error, cargar, revision }) })
    return () => control.abort()
  }, [cargar, revision])
  const vigente = estado.cargar === cargar && estado.revision === revision
  return { ...(vigente ? estado : { datos: null, cargando: true, error: null }), recargar }
}
