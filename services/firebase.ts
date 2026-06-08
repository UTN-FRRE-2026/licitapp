import { initializeApp, getApps, getApp } from 'firebase/app'
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: 'AIzaSyDSXnfmGWC_ZAVVOuhYykJ19xaEZRU7gT4',
  authDomain: 'licitapp-e1841.firebaseapp.com',
  projectId: 'licitapp-e1841',
  storageBucket: 'licitapp-e1841.firebasestorage.app',
  messagingSenderId: '197930877614',
  appId: '1:197930877614:web:acf9324693a8f1751ba33f',
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
