# Equilibrio

Aplicación web para organizar actividades, cuidar hábitos y revisar cómo se distribuye el tiempo entre estudio, trabajo, vida personal y descanso. Incluye un modo estudiante para organizar horarios de clases.

Proyecto realizado para el TP2 de Desarrollo Frontend II con React + Vite, Firebase y Vercel.

- Aplicación: https://app-react-teal.vercel.app
- Repositorio: https://github.com/delfiataide/app-react
- Guion para la demostración: [DEMOSTRACION.md](DEMOSTRACION.md)

## Funciones

- Registro con nombre, correo y contraseña; inicio y cierre de sesión y recuperación de contraseña.
- Actividades con categoría, fecha, hora y duración; cambio de estado y eliminación.
- Agenda semanal y reprogramación de actividades.
- Hábitos con días programados y registro de cumplimiento.
- Modo estudiante: agregar, editar y eliminar clases y consultar la próxima clase.
- Balance del tiempo planificado y completado por período y categoría, con un objetivo semanal.
- Tema claro y oscuro.
- Panel lateral en computadora y botón Menú en pantallas de hasta 820 px.

## Ejecutar localmente

Se necesita Node.js 20.19.x o superior dentro de la versión 20, o Node.js 22.12.0 o superior, npm y un proyecto de Firebase. Estos requisitos corresponden a la versión de Vite instalada en el proyecto.

```bash
git clone https://github.com/delfiataide/app-react.git
cd app-react
npm install
```

Copiar `.env.example` como `.env` en la raíz y completar estas variables con la configuración de una aplicación web de Firebase:

| Variable | Campo de Firebase |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

Configurar Firebase como se indica abajo y ejecutar:

```bash
npm run dev
```

Abrir la dirección indicada por Vite en la terminal. Reiniciar el servidor si se modifica `.env`. En PowerShell, si la política de ejecución bloquea `npm.ps1`, usar `npm.cmd` en los mismos comandos.

## Configurar Firebase

1. Crear un proyecto en Firebase Console y registrar una aplicación web.
2. En Authentication, habilitar **Correo electrónico/contraseña**.
3. Crear una base de Cloud Firestore de edición Standard con identificador `(default)`.
4. Copiar `firestore.rules` en la pestaña de reglas de Firestore y publicarlas.
5. Completar las cuatro variables de configuración local.

La conexión se inicializa en `src/firebase.js`, que exporta `auth` y `db`. Las cuentas se gestionan con Firebase Authentication; las contraseñas no se guardan en las colecciones de Firestore.

### Datos guardados

| Colección | Información |
| --- | --- |
| `actividades` | Usuario (`uid`), título, categoría, fecha, hora, duración, estado de cumplimiento y fecha de creación. |
| `habitos` | Usuario (`uid`), título, meta, días programados, fechas de cumplimiento y fecha de creación. |
| `clases` | Usuario (`uid`), materia, día de la semana, horario de inicio y fin, y lugar. |
| `objetivos` | Categoría y minutos del objetivo semanal. El identificador del documento es el `uid` del usuario. |

Las consultas de actividades, hábitos y clases filtran por `uid`. Las reglas restringen el acceso a los datos de cada usuario y validan los campos de clases y objetivos. Publicar el archivo en GitHub no actualiza las reglas de la base: hay que publicarlas en Firebase Console.

Las preferencias de tema, sección y modo estudiante se guardan en `localStorage`. Los registros se guardan en Firestore y se consultan con suscripciones `onSnapshot`.

`.env` está excluido de Git. `.env.example` incluye los nombres de las variables sin valores. Las variables `VITE_` se incorporan al código del navegador: no deben contener claves privadas ni credenciales de cuentas de servicio. El acceso a los datos se controla con Authentication y las reglas de Firestore.

## Organización del código

| Archivo | Responsabilidad |
| --- | --- |
| `src/App.jsx` | Sesión, navegación y operaciones de consulta, creación, modificación y eliminación de actividades. |
| `src/firebase.js` | Inicialización de Authentication y Firestore. |
| `src/index.css` | Estilos generales y adaptación a celular. |
| `src/balanceUtils.jsx` | Cálculo de períodos y distribución del tiempo. |
| `src/components/AuthForm.jsx` | Registro, ingreso y recuperación de contraseña. |
| `src/components/ActivityForm.jsx` | Formulario y validaciones de actividades. |
| `src/components/ActivityList.jsx` | Lista y acciones sobre actividades. |
| `src/components/Reprogramar.jsx` | Cambio de fecha. |
| `src/components/Habits.jsx` | Hábitos y seguimiento semanal. |
| `src/components/Classes.jsx` | Gestión de clases. |
| `src/components/NextClass.jsx` | Próxima clase. |
| `src/components/Balance.jsx` | Distribución por categoría. |
| `src/components/BalancePage.jsx` | Resumen por período y objetivo semanal. |

## Comandos de verificación

```bash
npm run lint
npm run build
npm run preview
```

`lint` analiza el código; `build` genera `dist`; `preview` permite revisar esa compilación localmente. No hay una suite de pruebas automatizadas configurada.

## Publicar o actualizar en Vercel

1. Importar el repositorio de GitHub en Vercel.
2. Seleccionar Vite y la carpeta raíz que contiene `package.json`.
3. Usar `npm run build` como comando de compilación y `dist` como directorio de salida.
4. Cargar las cuatro variables de `.env.example` con sus valores en el entorno Production de Vercel.
5. Desplegar. Si se modifican las variables, realizar un nuevo despliegue.
6. Con la integración de GitHub activa, subir los cambios a `main` y comprobar que Vercel termine el despliegue correctamente.
7. Abrir la URL pública y probar las funciones. Las reglas se actualizan por separado en Firebase.

## Pruebas manuales

Realizar este recorrido desde la URL de Vercel con una cuenta de prueba y registrar resultados y capturas en la bitácora:

1. Crear una cuenta o iniciar sesión.
2. Agregar una actividad y localizar su documento en Firestore.
3. Recargar y comprobar que permanece.
4. Marcarla como hecha y verificar el cambio en Firestore y en el balance.
5. Reprogramarla desde Semana y comprobar la nueva fecha.
6. Eliminarla y verificar que desaparezca también de Firestore.
7. Crear un hábito y registrar su cumplimiento; guardar un objetivo semanal.
8. Activar el modo estudiante y agregar, editar y eliminar una clase.
9. Cerrar sesión e ingresar con otra cuenta para comprobar la separación de datos en la interfaz.
10. Comprobar validaciones y mensajes de carga, éxito y error.
11. En celular, abrir y cerrar Menú, elegir una sección y comprobar que se cierre. En computadora, comprobar que el panel lateral siga visible.

Este listado es una guía de verificación. Los resultados y las evidencias de cada versión se documentan en la bitácora del proceso.
