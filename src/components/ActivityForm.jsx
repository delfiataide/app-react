import { useState } from 'react'
import { CATS } from '../data'

export default function ActivityForm({ onAdd }) {
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('estudio')
  const [hora, setHora] = useState('09:00')
  const [duracion, setDuracion] = useState(60)
  const [mensaje, setMensaje] = useState(null) // { tipo: 'ok' | 'err', texto }

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) {
      setMensaje({ tipo: 'err', texto: 'Escribí un nombre para la actividad.' })
      return
    }
    if (!(Number(duracion) >= 15)) {
      setMensaje({ tipo: 'err', texto: 'La duración tiene que ser de al menos 15 minutos.' })
      return
    }
    onAdd({ titulo: titulo.trim(), categoria, hora, duracion: Number(duracion) })
    setTitulo('')
    setMensaje({ tipo: 'ok', texto: 'Actividad agregada.' })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className="ancho">
        Actividad
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: leer el apunte de Frontend"
          maxLength={60}
        />
      </label>
      <label>
        Categoría
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {Object.entries(CATS).map(([clave, nombre]) => (
            <option key={clave} value={clave}>{nombre}</option>
          ))}
        </select>
      </label>
      <label>
        Hora
        <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
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
        />
      </label>
      <div className="fin">
        <button className="btn" type="submit">Agregar al día</button>
      </div>
      <p className={'msg ancho ' + (mensaje?.tipo ?? '')} role="status">
        {mensaje?.texto}
      </p>
    </form>
  )
}
