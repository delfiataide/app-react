import { FRASES, MINUTOS_DISPONIBLES, formatMin } from '../data'

export default function Hero({ nombre, actividades }) {
  const hoy = new Date()
  const fecha = hoy.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const ocupado = actividades.reduce((suma, a) => suma + a.duracion, 0)
  const libre =
    ocupado > MINUTOS_DISPONIBLES ? 'Día lleno' : formatMin(MINUTOS_DISPONIBLES - ocupado)

  return (
    <section className="hero">
      <div>
        <h1>Hola, {nombre}</h1>
        <p className="fecha">{fecha}</p>
        <p className="frase">“{FRASES[hoy.getDay()]}”</p>
      </div>
      <div className="libre" aria-live="polite">
        <b>{libre}</b>
        <span>de tiempo libre hoy</span>
      </div>
    </section>
  )
}
