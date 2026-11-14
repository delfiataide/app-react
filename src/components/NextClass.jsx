import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

function buscarProxima(clases, ahora) {
  const opciones = []
  const horaValida = /^([01]\d|2[0-3]):[0-5]\d$/

  // Incluimos el mismo día de la semana siguiente.
  for (let diferencia = 0; diferencia <= 7; diferencia++) {
    const fecha = new Date(ahora)
    fecha.setHours(0, 0, 0, 0)
    fecha.setDate(fecha.getDate() + diferencia)

    const indiceDia = (fecha.getDay() + 6) % 7

    for (const clase of clases) {
      if (
        clase.dia !== indiceDia ||
        !horaValida.test(clase.inicio) ||
        !horaValida.test(clase.fin) ||
        clase.fin <= clase.inicio
      ) {
        continue
      }

      const [horaInicio, minutoInicio] = clase.inicio.split(':').map(Number)
      const [horaFin, minutoFin] = clase.fin.split(':').map(Number)

      const inicio = new Date(fecha)
      inicio.setHours(horaInicio, minutoInicio, 0, 0)

      const fin = new Date(fecha)
      fin.setHours(horaFin, minutoFin, 0, 0)

      if (fin > ahora) {
        opciones.push({
          ...clase,
          inicioFecha: inicio,
          enCurso: inicio <= ahora,
        })
      }
    }
  }

  opciones.sort((a, b) => a.inicioFecha - b.inicioFecha)

  return opciones[0] ?? null
}

export default function NextClass({ uid, onVerClases }) {
  const [clases, setClases] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const actualizar = () => setAhora(new Date())
    const reloj = setInterval(actualizar, 30000)

    window.addEventListener('focus', actualizar)
    document.addEventListener('visibilitychange', actualizar)

    return () => {
      clearInterval(reloj)
      window.removeEventListener('focus', actualizar)
      document.removeEventListener('visibilitychange', actualizar)
    }
  }, [])

  useEffect(() => {
    setClases([])
    setError('')
    setCargando(true)

    if (!uid) {
      setCargando(false)
      return
    }

    const consulta = query(
      collection(db, 'clases'),
      where('uid', '==', uid)
    )

    return onSnapshot(
      consulta,
      (resultado) => {
        setClases(
          resultado.docs.map((documento) => ({
            ...documento.data(),
            id: documento.id,
          }))
        )
        setCargando(false)
        setError('')
      },
      () => {
        setError('No se pudieron consultar tus clases.')
        setCargando(false)
      }
    )
  }, [uid])

  const proxima = buscarProxima(clases, ahora)
  const esHoy = proxima?.inicioFecha.toDateString() === ahora.toDateString()

  const titulo = proxima?.enCurso
    ? 'Clase en curso'
    : esHoy
      ? 'Tu próxima clase de hoy'
      : 'Próxima clase'

  return (
    <section className="card proxima-clase">
      <h2>{titulo}</h2>

      {cargando ? (
        <p role="status">Consultando tu horario…</p>
      ) : error ? (
        <p className="msg err" role="alert">{error}</p>
      ) : proxima ? (
        <>
          <span className="proxima-clase-etiqueta">
            {proxima.enCurso ? 'En curso' : esHoy ? 'Hoy' : 'En tu agenda'}
          </span>

          <h3>{proxima.materia}</h3>

          <p className="nota">
            {proxima.inicioFecha.toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>

          <p className="proxima-clase-hora">
            {proxima.inicio} — {proxima.fin}
          </p>

          {proxima.lugar && (
            <p className="nota">{proxima.lugar}</p>
          )}
        </>
      ) : (
        <p className="nota">
          Todavía no tenés clases cargadas. Agregá tu horario para verlo acá.
        </p>
      )}

      <button
        className="cuenta-salir"
        type="button"
        onClick={onVerClases}
      >
        Ver mis clases →
      </button>
    </section>
  )
}