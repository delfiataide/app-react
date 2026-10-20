import { CATS, formatMin } from '../data'

export default function ActivityList({ actividades, cargando, onToggle, onDelete }) {
  const ordenadas = [...actividades].sort((a, b) => a.hora.localeCompare(b.hora))

  if (cargando) {
    return <p className="vacio">Cargando tu día…</p>
  }

  if (ordenadas.length === 0) {
    return <p className="vacio">Todavía no cargaste nada para hoy. Agregá la primera actividad abajo.</p>
  }

  return (
    <div>
      {ordenadas.map((a) => (
        <div
          key={a.id}
          className={'act' + (a.hecha ? ' hecha' : '')}
          style={{ '--c': `var(--${a.categoria})` }}
        >
          <input
            type="checkbox"
            checked={a.hecha}
            onChange={() => onToggle(a.id)}
            aria-label="Marcar como hecha"
          />
          <div>
            <div className="titulo">{a.titulo}</div>
            <div className="meta">
              {a.hora} · {formatMin(a.duracion)} · {CATS[a.categoria]}
            </div>
          </div>
          <button className="borrar" onClick={() => onDelete(a.id)} aria-label="Eliminar actividad">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
