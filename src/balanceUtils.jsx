import { CATS } from './data'

function iso(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export function rangoPeriodo(periodo, ahora = new Date()) {
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 12)
  let fin
  if (periodo === 'mes') {
    inicio.setDate(1)
    fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0, 12)
  } else {
    inicio.setDate(inicio.getDate() - (inicio.getDay() + 6) % 7 - (periodo === 'anterior' ? 7 : 0))
    fin = new Date(inicio)
    fin.setDate(fin.getDate() + 6)
  }
  return { inicio: iso(inicio), fin: iso(fin) }
}

export function calcularBalance(actividades, rango, modo) {
  const periodo = actividades.filter((a) => typeof a.fecha === 'string'
    && a.fecha >= rango.inicio && a.fecha <= rango.fin)
  const visibles = periodo.filter((a) => (modo !== 'completado' || a.hecha)
    && Object.hasOwn(CATS, a.categoria) && Number.isFinite(Number(a.duracion)) && Number(a.duracion) > 0)
    .map((a) => ({ ...a, duracion: Number(a.duracion) }))
  const porCategoria = Object.fromEntries(Object.keys(CATS).map((clave) => [clave, 0]))
  visibles.forEach((a) => { porCategoria[a.categoria] += a.duracion })
  return { visibles, porCategoria, total: visibles.reduce((suma, a) => suma + a.duracion, 0),
    cantidad: periodo.length, completadas: periodo.filter((a) => a.hecha).length }
}
