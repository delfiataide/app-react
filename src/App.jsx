import { useEffect, useState } from 'react'
import Hero from './components/Hero'
import ActivityList from './components/ActivityList'
import ActivityForm from './components/ActivityForm'
import Balance from './components/Balance'

const EJEMPLOS = [
  { id: '1', titulo: 'Clase de Frontend II', categoria: 'estudio', hora: '08:00', duracion: 240, hecha: false },
  { id: '2', titulo: 'Trabajo: reunión con cliente', categoria: 'trabajo', hora: '14:00', duracion: 90, hecha: false },
  { id: '3', titulo: 'Caminata', categoria: 'personal', hora: '18:30', duracion: 45, hecha: true },
]

export default function App() {
  const [actividades, setActividades] = useState(EJEMPLOS)
  const [tema, setTema] = useState('claro')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema === 'oscuro' ? 'dark' : 'light')
  }, [tema])

  // Por ahora estas tres funciones solo cambian datos en memoria.
  // Más adelante van a leer y escribir en Firebase.
  function agregar(nueva) {
    setActividades([...actividades, { ...nueva, id: crypto.randomUUID(), hecha: false }])
  }
  function alternarHecha(id) {
    setActividades(actividades.map((a) => (a.id === id ? { ...a, hecha: !a.hecha } : a)))
  }
  function eliminar(id) {
    setActividades(actividades.filter((a) => a.id !== id))
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
        <Hero nombre="Sofi" actividades={actividades} />
        <div className="grilla">
          <section className="card">
            <h2>Tu día</h2>
            <ActivityList actividades={actividades} onToggle={alternarHecha} onDelete={eliminar} />
            <ActivityForm onAdd={agregar} />
          </section>
          <Balance actividades={actividades} />
        </div>
      </main>
    </div>
  )
}
