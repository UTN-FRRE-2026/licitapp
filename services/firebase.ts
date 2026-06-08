import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// initializeAuth must only be called once per app instance.
// On hot reload Metro re-executes this module, so getAuth() is used as
// a fallback when auth is already initialized.
let auth
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  })
} catch {
  auth = getAuth(app)
}

export { auth }
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
