import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
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
import Hero from './components/Hero'
import ActivityList from './components/ActivityList'
import ActivityForm from './components/ActivityForm'
import Balance from './components/Balance'
import './avisos.css'

const NOMBRE = 'Delfina'

// Fecha de hoy como texto "2026-10-21" (con la hora local, no UTC)
function hoyISO() {
  const d = new Date()
  const dos = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
}

export default function App() {
  const [uid, setUid] = useState(null)
  const [todas, setTodas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [tema, setTema] = useState('claro')

  const hoy = hoyISO()
  const actividades = todas.filter((a) => a.fecha === hoy)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema === 'oscuro' ? 'dark' : 'light')
  }, [tema])

  // 1) Identifica al visitante con auth anónima
  // 2) Escucha en tiempo real SUS actividades en Firestore
  useEffect(() => {
    let dejarDeEscuchar = null
    const cortarAuth = onAuthStateChanged(auth, (usuario) => {
      if (!usuario) {
        signInAnonymously(auth).catch(() => {
          setError('No se pudo iniciar sesión. Revisá que el acceso anónimo esté activado en Firebase.')
          setCargando(false)
        })
        return
      }
      setUid(usuario.uid)
      const consulta = query(collection(db, 'actividades'), where('uid', '==', usuario.uid))
      dejarDeEscuchar = onSnapshot(
        consulta,
        (snap) => {
          setTodas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
          setError(null)
          setCargando(false)
        },
        () => {
          setError('No se pudieron cargar tus actividades. Revisá tu conexión y las reglas de Firestore.')
          setCargando(false)
        },
      )
    })
    return () => {
      cortarAuth()
      if (dejarDeEscuchar) dejarDeEscuchar()
    }
  }, [])

  // Escribir en Firestore: agregar, modificar y eliminar
  async function agregar(nueva) {
    try {
      await addDoc(collection(db, 'actividades'), {
        ...nueva,
        uid,
        fecha: hoy,
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
    const actual = todas.find((a) => a.id === id)
    try {
      await updateDoc(doc(db, 'actividades', id), { hecha: !actual.hecha })
    } catch {
      setError('No se pudo actualizar la actividad.')
    }
  }

  async function eliminar(id) {
    try {
      await deleteDoc(doc(db, 'actividades', id))
    } catch {
      setError('No se pudo eliminar la actividad.')
    }
  }

  return (
    <div className="app">
      <aside className="lateral">
        <div className="logo">Equilibrio</div>
        <nav className="nav" aria-label="Secciones">
          <button aria-current="page">Hoy</button>
          <button disabled>Semana <small>V2</small></button>
          <button disabled>Mi balance <small>V2</small></button>
          <button disabled>Hábitos <small>V3</small></button>
        </nav>
        <button className="tema" onClick={() => setTema(tema === 'claro' ? 'oscuro' : 'claro')}>
          Cambiar tema
        </button>
      </aside>

      <main>
        <Hero nombre={NOMBRE} actividades={actividades} />
        {error && <div className="aviso" role="alert">{error}</div>}
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
          <Balance actividades={actividades} />
        </div>
      </main>
    </div>
  )
}
