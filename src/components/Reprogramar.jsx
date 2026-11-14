import { useState } from 'react'

export default function Reprogramar({ actividad, onReschedule }) {
  const [abierto, setAbierto] = useState(false)
  const [fecha, setFecha] = useState(actividad.fecha)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function guardar(evento) {
    evento.preventDefault()
    if (guardando || !fecha || fecha === actividad.fecha) return

    setGuardando(true)
    setError('')

    try {
      const exito = await onReschedule(actividad.id, fecha)

      if (exito) {
        setAbierto(false)
      } else {
        setError('No se pudo cambiar la fecha. Probá de nuevo.')
      }
    } catch {
      setError('No se pudo cambiar la fecha. Probá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        className="reprogramar-boton"
        onClick={() => {
          setFecha(actividad.fecha)
          setError('')
          setAbierto(true)
        }}
      >
        Reprogramar
      </button>
    )
  }

  return (
    <form className="reprogramar-form" onSubmit={guardar}>
      <label>
        Nueva fecha para {actividad.titulo}
        <input
          type="date"
          required
          value={fecha}
          disabled={guardando}
          onChange={(evento) => setFecha(evento.target.value)}
        />
      </label>

      <button
        className="btn"
        type="submit"
        disabled={guardando || !fecha || fecha === actividad.fecha}
      >
        {guardando ? 'Guardando…' : 'Guardar fecha'}
      </button>

      <button
        className="cuenta-salir"
        type="button"
        disabled={guardando}
        onClick={() => setAbierto(false)}
      >
        Cancelar
      </button>

      {error && (
        <p className="msg err" role="alert">{error}</p>
      )}
    </form>
  )
}