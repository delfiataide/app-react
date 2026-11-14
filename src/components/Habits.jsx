import { useEffect, useState } from 'react'
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const NOMBRES_DIAS = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves',
  'Viernes', 'Sábado', 'Domingo',
]

function fechaISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')

  return `${fecha.getFullYear()}-${mes}-${dia}`
}

function obtenerProgramados(habito) {
  if (!Array.isArray(habito.diasProgramados)) return []

  return [...new Set(habito.diasProgramados)]
    .filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6)
    .sort((a, b) => a - b)
}

export default function Habits({ uid }) {
  const [habitos, setHabitos] = useState([])
  const [titulo, setTitulo] = useState('')
  const [diasElegidos, setDiasElegidos] = useState([0, 2, 4])
  const [vista, setVista] = useState('hoy')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [actualizando, setActualizando] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const actualizarFecha = () => setAhora(new Date())
    const reloj = setInterval(actualizarFecha, 30000)

    window.addEventListener('focus', actualizarFecha)
    document.addEventListener('visibilitychange', actualizarFecha)

    return () => {
      clearInterval(reloj)
      window.removeEventListener('focus', actualizarFecha)
      document.removeEventListener('visibilitychange', actualizarFecha)
    }
  }, [])

  const hoy = fechaISO(ahora)
  const indiceHoy = (ahora.getDay() + 6) % 7

  const lunes = new Date(`${hoy}T12:00:00`)
  lunes.setDate(lunes.getDate() - indiceHoy)

  const semana = Array.from({ length: 7 }, (_, indice) => {
    const fecha = new Date(lunes)
    fecha.setDate(fecha.getDate() + indice)

    return {
      fecha: fechaISO(fecha),
      nombre: ['L', 'M', 'Mi', 'J', 'V', 'S', 'D'][indice],
      descripcion: fecha.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    }
  })

  const habitosHoy = habitos.filter((habito) =>
    obtenerProgramados(habito).includes(indiceHoy)
  )

  const visibles = vista === 'hoy' ? habitosHoy : habitos

  const completadosHoy = habitosHoy.filter((habito) =>
    Array.isArray(habito.dias) && habito.dias.includes(hoy)
  ).length

  useEffect(() => {
    setHabitos([])
    setCargando(true)
    setError('')

    if (!uid) {
      setCargando(false)
      return
    }

    const consulta = query(
      collection(db, 'habitos'),
      where('uid', '==', uid)
    )

    return onSnapshot(
      consulta,
      (resultado) => {
        setHabitos(
          resultado.docs.map((documento) => ({
            ...documento.data(),
            id: documento.id,
          }))
        )
        setCargando(false)
      },
      () => {
        setError('No se pudieron cargar los hábitos. Revisá tu conexión.')
        setCargando(false)
      }
    )
  }, [uid])

  function alternarDia(indice) {
    setDiasElegidos((actuales) =>
      actuales.includes(indice)
        ? actuales.filter((dia) => dia !== indice)
        : [...actuales, indice].sort((a, b) => a - b)
    )
  }

  async function agregarHabito(evento) {
    evento.preventDefault()
    if (!uid || guardando) return

    setError('')
    setMensaje('')

    if (!titulo.trim() || titulo.trim().length > 60) {
      setError('Escribí un nombre de entre 1 y 60 caracteres.')
      return
    }

    if (diasElegidos.length === 0) {
      setError('Elegí al menos un día para tu hábito.')
      return
    }

    setGuardando(true)

    try {
      await addDoc(collection(db, 'habitos'), {
        titulo: titulo.trim(),
        uid,
        meta: diasElegidos.length,
        diasProgramados: [...diasElegidos],
        dias: [],
        creadaEn: serverTimestamp(),
      })

      const correspondeHoy = diasElegidos.includes(
        (new Date().getDay() + 6) % 7
      )

      setTitulo('')
      setMensaje(
        correspondeHoy
          ? 'Hábito creado. Lo vas a encontrar en “Para hoy”.'
          : 'Hábito creado. Podés verlo en “Todos mis hábitos”.'
      )
    } catch {
      setError('No se pudo guardar el hábito. Probá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  async function alternarHoy(habito) {
    if (!uid || actualizando !== null) return

    // Comprobamos la fecha otra vez al tocar el botón.
    const fechaActual = new Date()
    const indiceActual = (fechaActual.getDay() + 6) % 7

    setAhora(fechaActual)
    setError('')
    setMensaje('')

    if (!obtenerProgramados(habito).includes(indiceActual)) {
      setError('Este hábito no está programado para hoy.')
      return
    }

    const fecha = fechaISO(fechaActual)
    const dias = Array.isArray(habito.dias) ? habito.dias : []
    const hecho = dias.includes(fecha)

    setActualizando(habito.id)

    try {
      await updateDoc(doc(db, 'habitos', habito.id), {
        dias: hecho ? arrayRemove(fecha) : arrayUnion(fecha),
      })

      setMensaje(
        hecho
          ? `Desmarcaste "${habito.titulo}" para hoy.`
          : `¡Bien! Completaste "${habito.titulo}" hoy.`
      )
    } catch {
      setError('No se pudo actualizar el hábito. Probá de nuevo.')
    } finally {
      setActualizando(null)
    }
  }

  return (
    <section className="habitos-pagina">
      <header className="habitos-intro">
        <span className="habitos-etiqueta">UN POCO CADA DÍA</span>
        <h2>Construí tu constancia</h2>

        <p>
          Hoy es {NOMBRES_DIAS[indiceHoy].toLowerCase()}.
          Concentrate en los hábitos que te corresponden.
        </p>

        <span className="habitos-semana">
          Semana del {lunes.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
          })}
        </span>
      </header>

      <div
        className="habitos-filtros"
        role="group"
        aria-label="Hábitos a mostrar"
      >
        <button
          type="button"
          aria-pressed={vista === 'hoy'}
          onClick={() => setVista('hoy')}
        >
          Para hoy {!cargando && `(${habitosHoy.length})`}
        </button>

        <button
          type="button"
          aria-pressed={vista === 'todos'}
          onClick={() => setVista('todos')}
        >
          Todos mis hábitos
        </button>
      </div>

      {!cargando && vista === 'hoy' && habitosHoy.length > 0 && (
        <p className="nota" role="status">
          Completaste {completadosHoy} de {habitosHoy.length} hábitos de hoy.
          {completadosHoy === habitosHoy.length
            ? ' ¡Terminaste por hoy!'
            : ''}
        </p>
      )}

      {error && <p className="msg err" role="alert">{error}</p>}
      <p className="msg ok" role="status">{mensaje}</p>

      {cargando ? (
        <p role="status">Cargando hábitos…</p>
      ) : visibles.length === 0 ? (
        <p className="vacio">
          {habitos.length === 0
            ? 'Todavía no creaste hábitos. Empezá con algo pequeño.'
            : 'No tenés hábitos programados para hoy. Podés consultar los demás en “Todos mis hábitos”.'}
        </p>
      ) : (
        <div className="habitos-grilla">
          {visibles.map((habito) => {
            const dias = Array.isArray(habito.dias) ? habito.dias : []
            const programados = obtenerProgramados(habito)
            const correspondeHoy = programados.includes(indiceHoy)

            const objetivo = programados.length ||
              (Number.isInteger(habito.meta) &&
              habito.meta >= 1 &&
              habito.meta <= 7
                ? habito.meta
                : 3)

            const cumplidos = semana.filter((dia) =>
              dias.includes(dia.fecha)
            ).length

            const hechoHoy = dias.includes(hoy)

            return (
              <article className="habito-tarjeta" key={habito.id}>
                <h3>{habito.titulo}</h3>

                <p className="nota">
                  {programados.length > 0
                    ? programados.map((indice) => NOMBRES_DIAS[indice]).join(' · ')
                    : 'Sin días asignados'}
                </p>

                <p className="nota">
                  Meta: {objetivo} {objetivo === 1 ? 'día' : 'días'} por semana
                </p>

                <ul className="habito-dias" aria-label="Avance de esta semana">
                  {semana.map((dia, indice) => {
                    const cumplido = dias.includes(dia.fecha)
                    const programado = programados.includes(indice)

                    return (
                      <li
                        key={dia.fecha}
                        className={[
                          'habito-dia',
                          programado ? 'programado' : '',
                          cumplido ? 'cumplido' : '',
                          dia.fecha === hoy ? 'es-hoy' : '',
                        ].join(' ')}
                        aria-label={`${dia.descripcion}: ${
                          cumplido
                            ? 'cumplido'
                            : programado
                              ? 'programado, sin registrar'
                              : 'no programado'
                        }`}
                        aria-current={dia.fecha === hoy ? 'date' : undefined}
                      >
                        <span className="habito-dia-nombre" aria-hidden="true">
                          {dia.nombre}
                        </span>

                        <span className="habito-dia-circulo" aria-hidden="true">
                          {cumplido ? '✓' : Number(dia.fecha.slice(-2))}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                <progress
                  className="habito-progreso"
                  value={Math.min(cumplidos, objetivo)}
                  max={objetivo}
                  aria-label={`Progreso semanal de ${habito.titulo}`}
                />

                <p className="habito-resumen">
                  {cumplidos} de {objetivo} días cumplidos
                  {cumplidos >= objetivo ? ' · ¡Meta alcanzada!' : ''}
                </p>

                <button
                  className={`btn habito-accion ${hechoHoy ? 'esta-hecho' : ''}`}
                  type="button"
                  aria-pressed={hechoHoy}
                  disabled={!correspondeHoy || actualizando !== null}
                  onClick={() => alternarHoy(habito)}
                >
                  {actualizando === habito.id
                    ? 'Guardando…'
                    : !correspondeHoy
                      ? 'No corresponde hoy'
                      : hechoHoy
                        ? '✓ Completado hoy'
                        : 'Marcar como hecho'}
                </button>

                <p className="habito-ayuda">
                  {programados.length === 0
                    ? 'Este hábito antiguo no tiene días configurados.'
                    : !correspondeHoy
                      ? 'Podrás marcarlo en sus días programados.'
                      : hechoHoy
                        ? 'Podés tocar el botón para desmarcarlo.'
                        : 'Registrá tu avance de hoy.'}
                </p>
              </article>
            )
          })}
        </div>
      )}

      <details className="habito-nuevo">
        <summary>+ Crear un nuevo hábito</summary>

        <form onSubmit={agregarHabito}>
          <label className="ancho">
            Nuevo hábito
            <input
              required
              maxLength={60}
              value={titulo}
              disabled={guardando}
              onChange={(evento) => setTitulo(evento.target.value)}
              placeholder="Ej: leer 20 minutos"
            />
          </label>

          <fieldset
            className="habito-elegir-dias ancho"
            disabled={guardando}
          >
            <legend>¿Qué días querés hacerlo?</legend>

            <div className="habito-opciones-dias">
              {NOMBRES_DIAS.map((dia, indice) => (
                <label className="habito-opcion-dia" key={dia}>
                  <input
                    type="checkbox"
                    checked={diasElegidos.includes(indice)}
                    onChange={() => alternarDia(indice)}
                  />
                  <span>{dia}</span>
                </label>
              ))}
            </div>

            <p className="nota">
              {diasElegidos.length === 0
                ? 'Seleccioná al menos un día.'
                : `Meta: ${diasElegidos.length} ${
                    diasElegidos.length === 1 ? 'día' : 'días'
                  } por semana.`}
            </p>

            <p className="nota">
              Solo podrás marcar el hábito en los días seleccionados.
            </p>
          </fieldset>

          <button
            className="btn ancho"
            type="submit"
            disabled={!uid || guardando}
          >
            {guardando ? 'Guardando…' : 'Crear hábito'}
          </button>
        </form>
      </details>
    </section>
  )
}