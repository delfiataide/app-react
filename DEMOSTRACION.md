# Demostración de Equilibrio

Guion preparado a partir de la consigna del TP2. Duración orientativa: 5 a 7 minutos; la consigna no fija una duración para la demostración.

## Antes de empezar

- Abrir https://app-react-teal.vercel.app y usar una cuenta de prueba.
- Tener abiertas Firebase Console (Firestore > Datos), el repositorio y el código en el editor.
- Preparar `src/firebase.js`, `src/App.jsx` y `firestore.rules`. No abrir `.env` ni mostrar sus valores.
- Usar registros de prueba, sin información personal. Conservar las capturas necesarias antes de eliminarlos.

## 1. Presentar la idea

**Mostrar:** la pantalla principal de la aplicación publicada.

**Decir:** “Equilibrio es una aplicación para organizar actividades, cuidar hábitos y revisar cómo distribuimos el tiempo entre estudio, trabajo, vida personal y descanso. Está pensada para personas que necesitan organizar su rutina e incluye un modo estudiante para los horarios de clases. La desarrollé con React y Vite, utiliza Firebase y está publicada en Vercel.”

## 2. Mostrar el flujo completo de una actividad

**Hacer:**

1. En Hoy, agregar “Preparar la entrega”, categoría Estudio, con una duración de 30 minutos.
2. Mostrar el mensaje de guardado y la actividad en la lista.
3. En Firestore, localizar el documento nuevo dentro de `actividades` y mostrar su título, fecha, duración, estado y `uid`.
4. Recargar la web y comprobar que la actividad siga disponible.
5. Marcarla como hecha y comprobar en Firestore que `hecha` cambie a `true`.
6. En Semana, reprogramarla para el día siguiente y mostrar que cambia de fecha.
7. Eliminarla y comprobar que también desaparezca de Firestore.

**Decir:** “Este recorrido muestra las cuatro operaciones: consultar, agregar, modificar y eliminar. La información permanece al recargar porque se guarda en Firestore. El estado de React permite mostrarla en la interfaz, pero el almacenamiento persistente está en Firebase.”

**Si una operación falla:** mostrar el mensaje de error y explicar lo observado; no afirmar que el dato se guardó si no aparece en la base.

## 3. Mostrar las funciones que distinguen la propuesta

**Mostrar:**

- En Hábitos, los días programados y el registro de cumplimiento.
- En Mi balance, la diferencia entre tiempo planificado y completado y el objetivo semanal.
- Al activar Modo estudiante, la sección Clases y la próxima clase en Hoy, si hay una programada.

**Decir:** “La propuesta combina agenda, hábitos y una lectura del tiempo por categoría. El balance suma la duración de las actividades; no mide el tiempo con un cronómetro. El modo estudiante permite mostrar los horarios de clases cuando el usuario los necesita.”

## 4. Explicar dónde se conecta Firebase

**Mostrar:** `src/firebase.js`.

**Decir:** “En este archivo se configura Firebase. `firebaseConfig` lee las cuatro variables mediante `import.meta.env`. `initializeApp` inicializa la aplicación, `getAuth` permite gestionar las cuentas y `getFirestore` obtiene la conexión a la base. El archivo exporta `auth` y `db` para usarlos desde los componentes.”

**Mostrar:** los nombres vacíos en `.env.example`, si se quiere explicar la configuración. No es necesario abrir `.env`.

## 5. Explicar cómo se consultan y modifican los datos

**Mostrar:** estas funciones en `src/App.jsx`.

| Código | Explicación breve |
| --- | --- |
| `query`, `where` y `onSnapshot` | Consultan las actividades del usuario por `uid` y actualizan la pantalla cuando cambia la información. |
| `agregar` y `addDoc` | Crean un documento en `actividades` con los datos del formulario, el usuario, la fecha y el estado inicial. |
| `alternarHecha` y `updateDoc` | Cambian el estado de cumplimiento de una actividad. |
| `reprogramar` y `updateDoc` | Modifican la fecha. |
| `eliminar` y `deleteDoc` | Eliminan el documento de Firestore. |

**Decir:** “El formulario valida los datos antes de llamar a la función de guardado. Las operaciones esperan la respuesta de Firebase y muestran errores si fallan. La lista recibe los cambios mediante `onSnapshot`.”

**Mostrar:** `firestore.rules`.

**Decir:** “Las consultas filtran por usuario y las reglas controlan el acceso a la base. Para actividades, hábitos y clases, el `uid` del documento debe corresponder al usuario autenticado. Los objetivos usan el `uid` como identificador del documento. Las reglas se publican en Firebase por separado del despliegue de Vercel.”

## 6. Mostrar la adaptación y explicar el diseño

**Hacer:** reducir el ancho de la ventana hasta que aparezca Menú, abrirlo y elegir Semana. Volver al ancho de computadora.

**Decir:** “En celular la navegación se despliega con el botón Menú y se cierra al elegir una sección. En computadora se conserva el panel lateral. Las categorías usan colores para reconocer la distribución del tiempo, y se puede elegir tema claro u oscuro.”

**Apoyar con evidencias:** mostrar capturas de las versiones anteriores de la bitácora y explicar qué cambió y por qué. Usar solamente capturas y decisiones reales del proceso.

## 7. Explicar el uso de IA y la actualización publicada

**Decir:** “Utilicé IA como apoyo para revisar el proyecto y realizar ajustes. Un ejemplo fue pedir que la navegación del celular se desplegara con un botón Menú, conservando el panel lateral en computadora. Revisé el resultado y comprobé el comportamiento local antes de publicarlo.”

**Mostrar:** el commit `98c3506` en GitHub y el menú en la URL pública.

**Decir:** “La actualización del menú se subió a GitHub y Vercel informó que el despliegue terminó correctamente. También se comprobó que la URL pública sirviera el código actualizado. La bitácora reúne los cambios de las tres versiones y sus evidencias.”

La última frase sobre la bitácora debe usarse cuando ese documento esté completo. Agregar otras herramientas de IA o ejemplos solo si efectivamente se usaron.

## Preguntas para practicar

- ¿Qué diferencia hay entre el estado de React, `localStorage` y Firestore? React maneja la interfaz; `localStorage` conserva preferencias en ese navegador; Firestore guarda los registros asociados a la cuenta.
- ¿Por qué no basta con filtrar por `uid` en React? El acceso también debe restringirse con las reglas de Firestore.
- ¿Qué sucede al recargar? La sesión se comprueba con Authentication y los datos se vuelven a consultar en Firestore.
- ¿Publicar en Vercel actualiza las reglas? No. Las reglas se publican por separado en Firebase.
- ¿Dónde están las contraseñas? Las administra Firebase Authentication; no se guardan en las colecciones de la aplicación.
- ¿Hay notificaciones con la app cerrada? No están implementadas; no son un requisito de la consigna.
