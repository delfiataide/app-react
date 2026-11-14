import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { CATS, formatMin } from '../data'
import Balance from './Balance'
import { calcularBalance, rangoPeriodo } from '../balanceUtils'

export default function BalancePage({ uid, actividades, cargando }) {
  const [periodo, setPeriodo] = useState('semana')
  const [modo, setModo] = useState('planificado')
  const [categoria, setCategoria] = useState('personal')
  const [minutos, setMinutos] = useState(120)
  const [objetivo, setObjetivo] = useState(null)
  const [cargandoMeta, setCargandoMeta] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), 30000)
    return () => clearInterval(reloj)
  }, [])

  useEffect(() => {
    if (!uid) return
    return onSnapshot(doc(db, 'objetivos', uid), (snap) => {
      const datos = snap.exists() ? snap.data() : null
      const valida = datos && Object.hasOwn(CATS, datos.categoria)
        && Number.isInteger(datos.minutos) && datos.minutos >= 15 && datos.minutos <= 10080
      setObjetivo(valida ? datos : null)
      if (valida) { setCategoria(datos.categoria); setMinutos(datos.minutos) }
      setCargandoMeta(false)
    }, () => {
      setError('No se pudo cargar tu objetivo. Revisá la conexión y que las reglas de objetivos estén publicadas en Firebase.')
      setCargandoMeta(false)
    })
  }, [uid])

  const rango = rangoPeriodo(periodo, ahora)
  const resumen = calcularBalance(actividades, rango, modo)
  const semanaActual = rangoPeriodo('semana', ahora)
  const avance = objetivo ? calcularBalance(actividades, semanaActual, 'completado')
    .porCategoria[objetivo.categoria] : 0
  const lideres = Object.entries(resumen.porCategoria).filter(([, valor]) => valor > 0)
    .sort((a, b) => b[1] - a[1])
  const lider = lideres[0]
  const empate = lider && lideres.filter(([, valor]) => valor === lider[1]).length > 1
  const descripcionFecha = (fecha) => new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  async function guardarObjetivo(evento) {
    evento.preventDefault()
    if (guardando || !uid) return
    setError(''); setMensaje('')
    const valor = Number(minutos)
    if (!Number.isInteger(valor) || valor < 15 || valor > 10080) {
      setError('Elegí entre 15 y 10080 minutos semanales, sin decimales.')
      return
    }
    setGuardando(true)
    try {
      const nuevo = { categoria, minutos: valor }
      await setDoc(doc(db, 'objetivos', uid), nuevo)
      setObjetivo(nuevo)
      setMensaje('Objetivo semanal guardado.')
    } catch {
      setError('No se pudo guardar el objetivo. Revisá tu conexión y publicá las reglas actualizadas de Firestore.')
    } finally { setGuardando(false) }
  }

  return (
    <section className="balance-pagina">
      <header className="balance-intro">
        <span className="habitos-etiqueta">TU TIEMPO, TU EQUILIBRIO</span>
        <h2>Hacé espacio para lo que te importa</h2>
        <p className="nota">Revisá tu tiempo y elegí qué querés cuidar esta semana.</p>
      </header>

      <div className="balance-filtros">
        <label>Período
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="semana">Esta semana</option>
            <option value="anterior">Semana anterior</option>
            <option value="mes">Este mes</option>
          </select>
        </label>
        <div className="balance-modos" role="group" aria-label="Tiempo a mostrar">
          {['planificado', 'completado'].map((valor) => (
            <button key={valor} type="button" aria-pressed={modo === valor}
              onClick={() => setModo(valor)}>
              {valor === 'planificado' ? 'Planificado' : 'Completado'}
            </button>
          ))}
        </div>
      </div>

      <p className="nota balance-rango" aria-live="polite">
        Del {descripcionFecha(rango.inicio)} al {descripcionFecha(rango.fin)}
      </p>

      {cargando ? <p role="status">Cargando tu balance…</p> : <>
        <div className="balance-numeros" aria-live="polite">
          <article><span>Tiempo {modo}</span><strong>{formatMin(resumen.total)}</strong></article>
          <article><span>Actividades {modo === 'completado' ? 'completadas' : 'planificadas'}</span><strong>{resumen.visibles.length}</strong></article>
          <article><span>Actividades completadas del período</span><strong>{resumen.completadas} / {resumen.cantidad}</strong></article>
        </div>

        <Balance actividades={resumen.visibles} titulo="¿Dónde está tu tiempo?" />
        <p className="balance-lectura" aria-live="polite">
          {!lider ? `Todavía no hay tiempo ${modo} en este período.`
            : empate ? 'Hay categorías que comparten el mayor tiempo de este período.'
              : `${CATS[lider[0]]} concentra el ${Math.round(lider[1] / resumen.total * 100)}% de tu tiempo ${modo}.`}
        </p>
        <p className="nota">El tiempo completado suma la duración de las actividades marcadas como hechas; no es un cronómetro.</p>
      </>}

      <section className="card balance-meta">
        <h2>Mi objetivo semanal</h2>
        <p className="nota">Esta meta siempre corresponde a la semana actual, de lunes a domingo. Avanza al completar actividades de la categoría elegida.</p>
        {error && <p className="msg err" role="alert">{error}</p>}
        <p className="msg ok" role="status">{mensaje}</p>
        {cargandoMeta ? <p role="status">Cargando objetivo…</p>
          : objetivo && !cargando ? <div className="balance-meta-avance">
            <p><strong>{CATS[objetivo.categoria]} · {formatMin(objetivo.minutos)} por semana</strong></p>
            <progress max={objetivo.minutos} value={Math.min(avance, objetivo.minutos)} aria-label="Avance del objetivo semanal" />
            <p aria-live="polite">{formatMin(avance)} completados. {avance >= objetivo.minutos
              ? '¡Alcanzaste tu objetivo!'
              : `Te faltan ${formatMin(objetivo.minutos - avance)}.`}</p>
          </div> : !objetivo && <p className="nota">Elegí una categoría y una cantidad de tiempo para empezar.</p>}
        <form onSubmit={guardarObjetivo}>
          <label>Quiero dedicar tiempo a
            <select value={categoria} disabled={guardando || cargandoMeta} onChange={(e) => setCategoria(e.target.value)}>
              {Object.entries(CATS).map(([clave, nombre]) => <option value={clave} key={clave}>{nombre}</option>)}
            </select>
          </label>
          <label>Minutos por semana
            <input type="number" min="15" max="10080" step="1" required disabled={guardando || cargandoMeta}
              value={minutos} onChange={(e) => setMinutos(e.target.value)} />
          </label>
          <button className="btn ancho" disabled={guardando || cargandoMeta}>
            {guardando ? 'Guardando…' : objetivo ? 'Actualizar objetivo' : 'Guardar objetivo'}
          </button>
        </form>
      </section>
    </section>
  )
}
