import { initializeApp, getApps, getApp } from 'firebase/app'
import { initializeAuth, getAuth, type Auth, type Persistence } from 'firebase/auth'
import * as firebaseAuth from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

// getReactNativePersistence existe en el build de React Native de firebase (Metro
// lo resuelve en runtime), pero no figura en los tipos del entry por defecto
// (web/node) de firebase 10.x. Se accede vía namespace para evitar el TS2305.
const getReactNativePersistence = (
  firebaseAuth as unknown as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence
  }
).getReactNativePersistence

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

// Las variables EXPO_PUBLIC_* se inlinean en tiempo de build. En un build de EAS,
// si .env no se subió (está en .gitignore) y faltan en eas.json, quedan undefined
// y Firebase crashea recién al usar Auth, con un error confuso (auth/invalid-api-key).
// Fallamos temprano y con un mensaje claro que apunte a la causa real.
const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingConfig.length > 0) {
  throw new Error(
    `[firebase] Falta configuración: ${missingConfig.join(', ')}. ` +
      'Definí las variables EXPO_PUBLIC_FIREBASE_* en el bloque "env" del perfil ' +
      'correspondiente de eas.json (o en .env para correr en local).'
  )
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// initializeAuth must only be called once per app instance.
// On hot reload Metro re-executes this module, so getAuth() is used as
// a fallback when auth is already initialized.
let auth: Auth
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  })
} catch {
  auth = getAuth(app)
}

// Firebase Auth es lo único que seguimos usando de Firebase. Los datos de
// negocio viven en el backend .NET (PostgreSQL) y los adjuntos en el storage
// propio del backend (POST /api/files).

export { auth }

export default app
