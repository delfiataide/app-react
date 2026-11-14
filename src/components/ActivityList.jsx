import { CATS, formatMin } from '../data'
import Reprogramar from './Reprogramar'
export default function ActivityList({
  actividades,
  cargando,
  onToggle,
  onDelete,
  onReschedule,
}) {
  const ordenadas = [...actividades].sort((a, b) => a.hora.localeCompare(b.hora))

  if (cargando) {
    return <p className="vacio">Cargando tu día…</p>
  }

  if (ordenadas.length === 0) {
    return <p className="vacio">No hay actividades para este día.</p>
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
            {onReschedule && (
  <Reprogramar
    key={`${a.id}-${a.fecha}`}
    actividad={a}
    onReschedule={onReschedule}
  />
)}
          </div>
          <button className="borrar" onClick={() => onDelete(a.id)} aria-label="Eliminar actividad">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
