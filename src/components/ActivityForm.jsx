import { useState } from 'react'
import { CATS } from '../data'

export default function ActivityForm({ onAdd }) {
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('estudio')
  const [hora, setHora] = useState('09:00')
  const [duracion, setDuracion] = useState(60)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()

    if (guardando) return

    const nombre = titulo.trim()
    const minutos = Number(duracion)

    if (!nombre || nombre.length > 60) {
      setMensaje({
        tipo: 'err',
        texto: 'Escribí una actividad de entre 1 y 60 caracteres.',
      })
      return
    }

    if (!Object.hasOwn(CATS, categoria)) {
      setMensaje({
        tipo: 'err',
        texto: 'Elegí una categoría válida.',
      })
      return
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
      setMensaje({
        tipo: 'err',
        texto: 'Ingresá una hora válida.',
      })
      return
    }

    if (
      !Number.isInteger(minutos) ||
      minutos < 15 ||
      minutos > 720 ||
      minutos % 15 !== 0
    ) {
      setMensaje({
        tipo: 'err',
        texto: 'La duración debe estar entre 15 y 720 minutos, en pasos de 15.',
      })
      return
    }

    setGuardando(true)
    setMensaje(null)

    try {
      const exito = await onAdd({
        titulo: nombre,
        categoria,
        hora,
        duracion: minutos,
      })

      if (exito) {
        setTitulo('')
        setMensaje({
          tipo: 'ok',
          texto: 'Actividad guardada.',
        })
      } else {
        setMensaje({
          tipo: 'err',
          texto: 'No se pudo guardar. Probá de nuevo.',
        })
      }
    } catch {
      setMensaje({
        tipo: 'err',
        texto: 'No se pudo guardar. Revisá tu conexión y probá de nuevo.',
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={guardando}>
      <label className="ancho">
        Actividad
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: leer el apunte de Frontend"
          maxLength={60}
          disabled={guardando}
        />
      </label>

      <label>
        Categoría
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          disabled={guardando}
        >
          {Object.entries(CATS).map(([clave, nombre]) => (
            <option key={clave} value={clave}>
              {nombre}
            </option>
          ))}
        </select>
      </label>

      <label>
        Hora
        <input
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          disabled={guardando}
        />
      </label>

      <label>
        Duración (minutos)
        <input
          type="number"
          min="15"
          max="720"
          step="15"
          value={duracion}
          onChange={(e) => setDuracion(e.target.value)}
          disabled={guardando}
        />
      </label>

      <div className="fin">
        <button
          className="btn"
          type="submit"
          disabled={guardando}
        >
          {guardando ? 'Guardando…' : 'Agregar al día'}
        </button>
      </div>

      <p
        className={'msg ancho ' + (mensaje?.tipo ?? '')}
        role="status"
      >
        {mensaje?.texto}
      </p>
    </form>
  )
}