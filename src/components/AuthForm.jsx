import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, EmailAuthProvider, linkWithCredential, sendPasswordResetEmail, updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import './AuthForm.css'

function mensajeError(error) {
  const mensajes = {
    'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Elegí Iniciar sesión.',
    'auth/invalid-email': 'Ingresá un correo válido.',
    'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
    'auth/user-not-found': 'El correo o la contraseña no son correctos.',
    'auth/wrong-password': 'El correo o la contraseña no son correctos.',
    'auth/weak-password': 'La contraseña no cumple los requisitos de seguridad de Firebase.',
    'auth/password-does-not-meet-requirements': 'La contraseña no cumple los requisitos de seguridad de Firebase.',
    'auth/too-many-requests': 'Hubo muchos intentos. Esperá unos minutos y volvé a probar.',
    'auth/network-request-failed': 'Revisá tu conexión a internet y probá de nuevo.',
    'auth/operation-not-allowed': 'Para habilitar las cuentas, activá Correo electrónico/contraseña en Firebase Authentication.',
    'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  }
  return mensajes[error.code] || 'No se pudo completar la operación. Probá de nuevo.'
}

export default function AuthForm({ usuario, onAcceso }) {
  const [modo, setModo] = useState(usuario?.isAnonymous ? 'registro' : 'ingreso')
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const registro = modo === 'registro'
  const recuperar = modo === 'recuperar'

  function cambiarModo(nuevo) {
    setModo(nuevo); setError(''); setMensaje(''); setPassword(''); setConfirmacion('')
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (ocupado) return
    setError(''); setMensaje('')
    if (registro && password !== confirmacion) { setError('Las contraseñas no coinciden.'); return }
    if (registro && !nombre.trim()) { setError('Ingresá tu nombre.'); return }
    setOcupado(true)
    try {
      if (recuperar) {
        try { await sendPasswordResetEmail(auth, email.trim()) }
        catch (err) { if (err.code !== 'auth/user-not-found') throw err }
        setMensaje('Si el correo tiene una cuenta, recibirás un enlace para cambiar tu contraseña. Revisá también spam.')
      } else {
        let resultado
        if (registro) {
          resultado = auth.currentUser?.isAnonymous
            ? await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email.trim(), password))
            : await createUserWithEmailAndPassword(auth, email.trim(), password)
          try { await updateProfile(resultado.user, { displayName: nombre.trim() }) }
          catch { /* La cuenta ya existe; el correo permite identificarla. */ }
        } else {
          resultado = await signInWithEmailAndPassword(auth, email.trim(), password)
        }
        onAcceso(resultado.user)
      }
    } catch (err) { setError(mensajeError(err)) }
    finally { setOcupado(false) }
  }

  return (
    <main className="auth-pantalla">
      <section className="auth-tarjeta" aria-labelledby="auth-titulo">
        <p className="auth-marca">Equilibrio</p>
        <h1 id="auth-titulo">{recuperar ? 'Recuperá tu contraseña' : registro ? 'Creá tu cuenta' : 'Qué bueno verte de nuevo'}</h1>
        <p className="auth-descripcion">{recuperar ? 'Te enviaremos un enlace a tu correo.' : 'Un espacio para organizar tu día, cuidar tus hábitos y encontrar tu balance.'}</p>
        {usuario?.isAnonymous && <p className="nota">Al crear tu cuenta conservarás las actividades y hábitos de este navegador. Si ingresás a una cuenta existente, verás los datos de esa cuenta.</p>}
        <form className="auth-form" onSubmit={enviar}>
          <fieldset disabled={ocupado}>
            {registro && <label>Tu nombre<input required autoComplete="given-name" maxLength={60} value={nombre} onChange={(e) => setNombre(e.target.value)} /></label>}
            <label>Correo electrónico<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            {!recuperar && <label>Contraseña<input type="password" required minLength={registro ? 6 : undefined} autoComplete={registro ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />{registro && <span>Mínimo 6 caracteres.</span>}</label>}
            {registro && <label>Repetí la contraseña<input type="password" required autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} /></label>}
            {error && <p className="msg err" role="alert">{error}</p>}
            {mensaje && <p className="msg ok" role="status">{mensaje}</p>}
            <button className="btn" type="submit">{ocupado ? 'Un momento…' : recuperar ? 'Enviar enlace' : registro ? 'Crear cuenta' : 'Iniciar sesión'}</button>
          </fieldset>
        </form>
        <div className="auth-opciones">
          {!recuperar && <button disabled={ocupado} onClick={() => cambiarModo(registro ? 'ingreso' : 'registro')}>{registro ? 'Ya tengo una cuenta' : 'Crear una cuenta'}</button>}
          <button disabled={ocupado} onClick={() => cambiarModo(recuperar ? 'ingreso' : 'recuperar')}>{recuperar ? 'Volver a iniciar sesión' : 'Olvidé mi contraseña'}</button>
        </div>
      </section>
    </main>
  )
}
