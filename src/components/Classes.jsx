import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

const DIAS = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves',
  'Viernes', 'Sábado', 'Domingo',
]

const FORMULARIO_VACIO = {
  materia: '',
  dia: '0',
  inicio: '09:00',
  fin: '11:00',
  lugar: '',
}

export default function Classes({ uid }) {
  const [clases, setClases] = useState([])
  const [formulario, setFormulario] = useState({ ...FORMULARIO_VACIO })
  const [editando, setEditando] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    setClases([])
    setCargando(true)

    if (!uid) {
      setCargando(false)
      return
    }

    const consulta = query(
      collection(db, 'clases'),
      where('uid', '==', uid)
    )

    return onSnapshot(
      consulta,
      (resultado) => {
        setClases(
          resultado.docs.map((documento) => ({
            ...documento.data(),
            id: documento.id,
          }))
        )
        setCargando(false)
      },
      () => {
        setError('No se pudieron cargar las clases. Revisá la conexión y las reglas.')
        setCargando(false)
      }
    )
  }, [uid])

  function cambiarCampo(evento) {
    const { name, value } = evento.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
  }

  function limpiarFormulario() {
    setFormulario({ ...FORMULARIO_VACIO })
    setEditando(null)
  }

  function cancelarEdicion() {
    limpiarFormulario()
    setError('')
    setMensaje('')
  }

  function editar(clase) {
    if (ocupado) return

    setEditando(clase.id)
    setFormulario({
      materia: clase.materia,
      dia: String(clase.dia),
      inicio: clase.inicio,
      fin: clase.fin,
      lugar: clase.lugar ?? '',
    })
    setError('')
    setMensaje('')
  }

  async function guardar(evento) {
    evento.preventDefault()
    if (!uid || ocupado) return

    setError('')
    setMensaje('')

    const { materia, dia, inicio, fin, lugar } = formulario
    const horaValida = /^([01]\d|2[0-3]):[0-5]\d$/

    if (!materia.trim()) {
      setError('Escribí el nombre de la materia.')
      return
    }

    if (
      !horaValida.test(inicio) ||
      !horaValida.test(fin) ||
      fin <= inicio
    ) {
      setError('La clase debe terminar después de empezar.')
      return
    }

    const datos = {
      uid,
      materia: materia.trim(),
      dia: Number(dia),
      inicio,
      fin,
      lugar: lugar.trim(),
    }

    setOcupado(true)

    try {
      if (editando) {
        await updateDoc(doc(db, 'clases', editando), datos)
        setMensaje('Clase actualizada.')
      } else {
        await addDoc(collection(db, 'clases'), datos)
        setMensaje('Clase guardada.')
      }

      limpiarFormulario()
    } catch {
      setError('No se pudo guardar la clase. Revisá la conexión y los permisos.')
    } finally {
      setOcupado(false)
    }
  }

  async function eliminar(clase) {
    if (!uid || ocupado) return
    if (!window.confirm(`¿Eliminar la clase de ${clase.materia}?`)) return

    setOcupado(true)
    setError('')
    setMensaje('')

    try {
      await deleteDoc(doc(db, 'clases', clase.id))

      if (editando === clase.id) limpiarFormulario()

      setMensaje('Clase eliminada.')
    } catch {
      setError('No se pudo eliminar la clase. Probá de nuevo.')
    } finally {
      setOcupado(false)
    }
  }

  // Definimos el formulario antes del return principal.
  const formularioClase = (
    <form onSubmit={guardar}>
      {error && (
        <p className="msg err ancho" role="alert">{error}</p>
      )}

      <fieldset
        className="clases-formulario ancho"
        disabled={!uid || ocupado || cargando}
      >
        <label className="ancho">
          Materia
          <input
            name="materia"
            value={formulario.materia}
            onChange={cambiarCampo}
            required
            maxLength={80}
            placeholder="Ej: Desarrollo Frontend II"
          />
        </label>

        <label>
          Día
          <select
            name="dia"
            value={formulario.dia}
            onChange={cambiarCampo}
          >
            {DIAS.map((dia, indice) => (
              <option key={dia} value={indice}>{dia}</option>
            ))}
          </select>
        </label>

        <label>
          Aula, sede o enlace (opcional)
          <input
            name="lugar"
            value={formulario.lugar}
            onChange={cambiarCampo}
            maxLength={200}
            placeholder="Ej: Aula 203"
          />
        </label>

        <label>
          Inicio
          <input
            name="inicio"
            type="time"
            required
            value={formulario.inicio}
            onChange={cambiarCampo}
          />
        </label>

        <label>
          Fin
          <input
            name="fin"
            type="time"
            required
            value={formulario.fin}
            onChange={cambiarCampo}
          />
        </label>

        <button className="btn ancho" type="submit">
          {ocupado
            ? 'Guardando…'
            : editando ? 'Guardar cambios' : 'Agregar clase'}
        </button>

        {editando && (
          <button
            className="cuenta-salir ancho"
            type="button"
            onClick={cancelarEdicion}
          >
            Cancelar edición
          </button>
        )}
      </fieldset>
    </form>
  )

  return (
    <section className="clases-pagina">
      <p className="msg ok" role="status">{mensaje}</p>

      {!editando && (
        <section className="card">
          <h2>Agregar una clase</h2>

          <p className="nota">
            Armá tu horario habitual de cursada. Cada clase se repite
            semanalmente.
          </p>

          {formularioClase}
        </section>
      )}

      <section className="card">
        <h2>Tu horario semanal</h2>

        {cargando ? (
          <p role="status">Cargando clases…</p>
        ) : clases.length === 0 ? (
          <p className="nota">Todavía no cargaste clases.</p>
        ) : (
          DIAS.map((dia, indice) => {
            const clasesDelDia = clases
              .filter((clase) => clase.dia === indice)
              .sort((a, b) => a.inicio.localeCompare(b.inicio))

            if (clasesDelDia.length === 0) return null

            return (
              <section className="clases-dia" key={dia}>
                <h3>{dia}</h3>

                {clasesDelDia.map((clase) => (
                  <article className="clase-fila" key={clase.id}>
                    <div>
                      <strong>{clase.materia}</strong>
                      <p>{clase.inicio} — {clase.fin}</p>

                      {clase.lugar && (
                        <p className="nota">{clase.lugar}</p>
                      )}
                    </div>

                    <div className="clase-acciones">
                      <button
                        className="cuenta-salir"
                        type="button"
                        disabled={ocupado}
                        aria-expanded={editando === clase.id}
                        onClick={() =>
                          editando === clase.id
                            ? cancelarEdicion()
                            : editar(clase)
                        }
                      >
                        {editando === clase.id ? 'Cerrar edición' : 'Editar'}
                      </button>

                      <button
                        className="cuenta-salir"
                        type="button"
                        disabled={ocupado}
                        onClick={() => eliminar(clase)}
                      >
                        Eliminar
                      </button>
                    </div>

                    {editando === clase.id && (
                      <div className="clase-edicion">
                        <h4>Editar {clase.materia}</h4>
                        {formularioClase}
                      </div>
                    )}
                  </article>
                ))}
              </section>
            )
          })
        )}
      </section>
    </section>
  )
}