import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { auth, db } from './firebase'
import { FRASES } from './data'

import AuthForm from './components/AuthForm'
import ActivityList from './components/ActivityList'
import ActivityForm from './components/ActivityForm'
import Balance from './components/Balance'
import BalancePage from './components/BalancePage'
import Habits from './components/Habits'
import Classes from './components/Classes'
import NextClass from './components/NextClass'

import './avisos.css'

function fechaISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')

  return `${fecha.getFullYear()}-${mes}-${dia}`
}

function mostrarFecha(fecha) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [authLista, setAuthLista] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  const [todas, setTodas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [tema, setTema] = useState('claro')
  const [seccion, setSeccion] = useState('Hoy')
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [modoEstudiante, setModoEstudiante] = useState(false)

  const uid = usuario?.uid
  const hoy = fechaISO(new Date())

  const primerNombre =
    usuario?.displayName?.trim().split(/\s+/)[0] || ''

  const nombre = primerNombre
    ? primerNombre.charAt(0).toLocaleUpperCase('es-AR') +
      primerNombre.slice(1)
    : ''

  const numeroDia = Math.floor(
    Date.parse(`${hoy}T00:00:00Z`) / 86400000
  )

  const fraseDelDia = FRASES[numeroDia % FRASES.length]

  const actividades = todas.filter(
    (actividad) => actividad.fecha === hoy
  )

  const inicioSemana = new Date(`${hoy}T12:00:00`)
  const diaSemana = (inicioSemana.getDay() + 6) % 7

  inicioSemana.setDate(
    inicioSemana.getDate() - diaSemana + semanaOffset * 7
  )

  const fechasSemanaVisible = Array.from(
    { length: 7 },
    (_, indice) => {
      const fecha = new Date(inicioSemana)
      fecha.setDate(fecha.getDate() + indice)

      return fechaISO(fecha)
    }
  )

  const secciones = [
    'Hoy',
    'Semana',
    ...(modoEstudiante ? ['Clases'] : []),
    'Hábitos',
    'Mi balance',
  ]

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      tema === 'oscuro' ? 'dark' : 'light'
    )
  }, [tema])

  useEffect(() => {
    return onAuthStateChanged(auth, (actual) => {
      const seccionesValidas = [
        'Hoy', 'Semana', 'Clases', 'Hábitos', 'Mi balance',
      ]

      const guardada = actual
        ? localStorage.getItem(`equilibrio-seccion-${actual.uid}`)
        : 'Hoy'

      const estudianteActivo = actual
        ? localStorage.getItem(
            `equilibrio-estudiante-${actual.uid}`
          ) === 'true'
        : false

      let siguiente = seccionesValidas.includes(guardada)
        ? guardada
        : 'Hoy'

      if (siguiente === 'Clases' && !estudianteActivo) {
        siguiente = 'Hoy'
      }

      setUsuario(actual)
      setModoEstudiante(estudianteActivo)
      setSeccion(siguiente)
      setSemanaOffset(0)
      setTodas([])
      setCargando(true)
      setError(null)
      setAuthLista(true)
    })
  }, [])

  useEffect(() => {
    if (!authLista || !uid) return

    localStorage.setItem(
      `equilibrio-seccion-${uid}`,
      seccion
    )
  }, [seccion, uid, authLista])

  useEffect(() => {
    if (!usuario || usuario.isAnonymous) return

    let activa = true
    setCargando(true)

    const consulta = query(
      collection(db, 'actividades'),
      where('uid', '==', usuario.uid)
    )

    const cancelar = onSnapshot(
      consulta,
      (resultado) => {
        if (!activa) return

        setTodas(
          resultado.docs.map((documento) => ({
            ...documento.data(),
            id: documento.id,
          }))
        )

        setError(null)
        setCargando(false)
      },
      () => {
        if (!activa) return

        setError(
          'No se pudieron cargar tus actividades. Revisá tu conexión y las reglas de Firestore.'
        )
        setCargando(false)
      }
    )

    return () => {
      activa = false
      cancelar()
    }
  }, [usuario])

  function cambiarModoEstudiante() {
    if (!uid) return

    const nuevoModo = !modoEstudiante
    setModoEstudiante(nuevoModo)

    localStorage.setItem(
      `equilibrio-estudiante-${uid}`,
      String(nuevoModo)
    )

    if (!nuevoModo && seccion === 'Clases') {
      setSeccion('Hoy')
    }
  }

  async function cerrarSesion() {
    setSaliendo(true)

    try {
      await signOut(auth)
    } catch {
      setError('No se pudo cerrar la sesión. Probá de nuevo.')
    } finally {
      setSaliendo(false)
    }
  }

  async function agregar(nueva, fecha = hoy) {
    if (!uid) return false

    try {
      await addDoc(collection(db, 'actividades'), {
        ...nueva,
        uid,
        fecha,
        hecha: false,
        creadaEn: serverTimestamp(),
      })

      return true
    } catch {
      setError('No se pudo guardar la actividad. Probá de nuevo.')
      return false
    }
  }

  async function alternarHecha(id) {
    const actual = todas.find((actividad) => actividad.id === id)
    if (!uid || !actual) return

    try {
      await updateDoc(doc(db, 'actividades', id), {
        hecha: !actual.hecha,
      })
    } catch {
      setError('No se pudo actualizar la actividad.')
    }
  }

  async function reprogramar(id, nuevaFecha) {
    if (!uid || !/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) {
      return false
    }

    try {
      await updateDoc(doc(db, 'actividades', id), {
        fecha: nuevaFecha,
      })

      return true
    } catch {
      return false
    }
  }

  async function eliminar(id) {
    if (!uid) return

    try {
      await deleteDoc(doc(db, 'actividades', id))
    } catch {
      setError('No se pudo eliminar la actividad.')
    }
  }

  if (!authLista) {
    return (
      <div className="auth-pantalla" role="status">
        Cargando Equilibrio…
      </div>
    )
  }

  if (!usuario || usuario.isAnonymous) {
    return (
      <AuthForm
        usuario={usuario}
        onAcceso={setUsuario}
      />
    )
  }

  return (
    <div className="app">
      <aside className="lateral">
        <div className="logo">Equilibrio</div>

        <nav className="nav" aria-label="Secciones">
          {secciones.map((nombreSeccion) => (
            <button
              key={nombreSeccion}
              type="button"
              aria-current={
                seccion === nombreSeccion ? 'page' : undefined
              }
              onClick={() => setSeccion(nombreSeccion)}
            >
              {nombreSeccion}
            </button>
          ))}
        </nav>

        <label className="modo-estudiante">
          <input
            type="checkbox"
            role="switch"
            checked={modoEstudiante}
            onChange={cambiarModoEstudiante}
          />

          <span
            className="estudiante-switch"
            aria-hidden="true"
          />

          <span>Modo estudiante</span>
        </label>

        <button
          className="tema"
          type="button"
          onClick={() =>
            setTema(tema === 'claro' ? 'oscuro' : 'claro')
          }
        >
          Cambiar tema
        </button>
      </aside>

      <main>
        <header className="cuenta-cabecera">
          <div>
            <h2>
              {seccion === 'Hoy' && nombre
                ? `Hoy, ${nombre}`
                : seccion}
            </h2>

            {seccion === 'Hoy' && (
              <p className="nota">{fraseDelDia}</p>
            )}
          </div>

          <button
            className="cuenta-salir"
            type="button"
            onClick={cerrarSesion}
            disabled={saliendo}
          >
            {saliendo ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </header>

        {error && (
          <div className="aviso" role="alert">
            {error}
          </div>
        )}

        {seccion === 'Hoy' && (
          <div className="grilla">
            <section className="card">
              <h2>Tu día</h2>

              <ActivityList
                actividades={actividades}
                cargando={cargando}
                onToggle={alternarHecha}
                onDelete={eliminar}
              />

              <ActivityForm onAdd={agregar} />
            </section>

            <div className="resumen-dia">
              <Balance actividades={actividades} />

              {modoEstudiante && (
                <NextClass
                  key={uid}
                  uid={uid}
                  onVerClases={() => setSeccion('Clases')}
                />
              )}
            </div>
          </div>
        )}

        {seccion === 'Semana' && (
          <section className="semana">
            <div className="semana-controles">
              <button
                className="cuenta-salir"
                type="button"
                onClick={() =>
                  setSemanaOffset((valor) => valor - 1)
                }
              >
                ← Anterior
              </button>

              <button
                className="cuenta-salir"
                type="button"
                onClick={() => setSemanaOffset(0)}
                disabled={semanaOffset === 0}
              >
                Semana actual
              </button>

              <button
                className="cuenta-salir"
                type="button"
                onClick={() =>
                  setSemanaOffset((valor) => valor + 1)
                }
              >
                Siguiente →
              </button>
            </div>

            <p className="nota" aria-live="polite">
              Del {mostrarFecha(fechasSemanaVisible[0])}
              {' al '}
              {mostrarFecha(fechasSemanaVisible[6])}
            </p>

            {fechasSemanaVisible.map((fecha) => (
              <section className="card" key={fecha}>
                <h2>
                  {new Date(
                    `${fecha}T12:00:00`
                  ).toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                  {fecha === hoy ? ' · Hoy' : ''}
                </h2>

                <ActivityList
                  actividades={todas.filter(
                    (actividad) => actividad.fecha === fecha
                  )}
                  cargando={cargando}
                  onToggle={alternarHecha}
                  onDelete={eliminar}
                  onReschedule={reprogramar}
                />

                <details className="agregar-dia">
                  <summary>
                    + Agregar actividad a este día
                  </summary>

                  <ActivityForm
                    onAdd={(nueva) => agregar(nueva, fecha)}
                  />
                </details>
              </section>
            ))}
          </section>
        )}

        {modoEstudiante && seccion === 'Clases' && (
          <Classes key={uid} uid={uid} />
        )}

        {seccion === 'Hábitos' && (
          <Habits key={uid} uid={uid} />
        )}

        {seccion === 'Mi balance' && (
          <BalancePage
            key={uid}
            uid={uid}
            actividades={todas}
            cargando={cargando}
          />
        )}
      </main>
    </div>
  )
}