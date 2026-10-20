import { CATS, formatMin } from '../data'

export default function Balance({ actividades }) {
  const porCategoria = Object.fromEntries(Object.keys(CATS).map((k) => [k, 0]))
  actividades.forEach((a) => {
    porCategoria[a.categoria] += a.duracion
  })
  const total = actividades.reduce((suma, a) => suma + a.duracion, 0)

  return (
    <section className="card">
      <h2>Balance de hoy</h2>
      <div className="barra" aria-hidden="true">
        {Object.keys(CATS).map((k) =>
          porCategoria[k] ? (
            <i key={k} style={{ width: `${(porCategoria[k] / total) * 100}%`, background: `var(--${k})` }} />
          ) : null,
        )}
      </div>
      {Object.entries(CATS).map(([k, nombre]) => (
        <div className="fila" key={k} style={{ '--c': `var(--${k})` }}>
          <span className="punto" />
          <span>{nombre}</span>
          <b>{formatMin(porCategoria[k])}</b>
        </div>
      ))}
    </section>
  )
}
