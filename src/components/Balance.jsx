import { CATS, formatMin } from '../data'

export default function Balance({
  actividades,
  titulo = 'Balance de hoy',
}) {
  const porCategoria = Object.fromEntries(
    Object.keys(CATS).map((categoria) => [categoria, 0])
  )

  actividades.forEach((actividad) => {
    porCategoria[actividad.categoria] += actividad.duracion
  })

  const total = actividades.reduce(
    (suma, actividad) => suma + actividad.duracion,
    0
  )

  return (
    <section className="card">
      <h2>{titulo}</h2>

      <div className="barra" aria-hidden="true">
        {Object.keys(CATS).map((categoria) =>
          porCategoria[categoria] > 0 ? (
            <i
              key={categoria}
              style={{
                width: `${(porCategoria[categoria] / total) * 100}%`,
                background: `var(--${categoria})`,
              }}
            />
          ) : null
        )}
      </div>

      {Object.entries(CATS).map(([categoria, nombre]) => (
        <div
          className="fila"
          key={categoria}
          style={{ '--c': `var(--${categoria})` }}
        >
          <span className="punto" />
          <span>{nombre}</span>
          <b>{formatMin(porCategoria[categoria])}</b>
        </div>
      ))}
    </section>
  )
}