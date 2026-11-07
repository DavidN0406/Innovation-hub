import { useEffect, useRef, useState } from 'react'

export default function useOperacion() {
  const control = useRef(null)
  const bloqueo = useRef(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => () => control.current?.abort(), [])
  async function ejecutar(operacion, alCompletar) {
    if (bloqueo.current) return
    bloqueo.current = true
    const actual = new AbortController()
    control.current = actual
    setOcupado(true)
    setError(null)
    try {
      const datos = await operacion(actual.signal)
      if (!actual.signal.aborted) alCompletar?.(datos)
    } catch (fallo) {
      if (!actual.signal.aborted) setError(fallo)
    } finally {
      bloqueo.current = false
      if (!actual.signal.aborted) setOcupado(false)
    }
  }
  return { ocupado, error, ejecutar, limpiarError: () => setError(null) }
}
