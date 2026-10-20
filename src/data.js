export const CATS = {
  estudio: 'Estudio',
  trabajo: 'Trabajo',
  personal: 'Personal',
  descanso: 'Descanso',
}

export const FRASES = [
  'Empezá chiquito, pero empezá.',
  'Hoy alcanza con avanzar un poco.',
  'Descansar también es parte del plan.',
  'Lo constante le gana a lo perfecto.',
  'Una cosa a la vez.',
  'Cuidá tu energía como cuidás tus entregas.',
  'Mañana te agradece lo que hagas hoy.',
]

// Minutos que consideramos "disponibles" en un día (16 h despierta)
export const MINUTOS_DISPONIBLES = 16 * 60

export function formatMin(m) {
  const h = Math.floor(m / 60)
  const r = m % 60
  if (!h) return `${r} min`
  return r ? `${h} h ${r} min` : `${h} h`
}
