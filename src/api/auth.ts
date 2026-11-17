import { initializeApp } from 'firebase/app'
import {
  type Auth,
  type User,
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'

// Único punto de contacto con el SDK de Firebase. El navegador solo usa Auth:
// el backend niega todo acceso cliente a Firestore (ADR 0002 del backend).

let authInstance: Auth | undefined

function firebaseAuth(): Auth {
  if (authInstance) return authInstance
  const env = import.meta.env
  if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_PROJECT_ID) {
    throw new Error('Falta la configuración de Firebase: copia .env.example a .env.local.')
  }
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  })
  const auth = getAuth(app)
  auth.languageCode = 'es'
  if (env.VITE_FIREBASE_AUTH_EMULATOR_HOST) {
    connectAuthEmulator(auth, `http://${env.VITE_FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true })
  }
  authInstance = auth
  return auth
}

export interface AuthUser {
  uid: string
  email: string | null
  name: string | null
}

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email, name: user.displayName }
}

/** Llama a `callback` con el usuario actual y en cada cambio; devuelve la función para dejar de escuchar. */
export function onAuthUserChanged(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth(), (user) => callback(user ? toAuthUser(user) : null))
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(firebaseAuth(), new GoogleAuthProvider())
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(firebaseAuth(), email, password)
}

export function signOut(): Promise<void> {
  return firebaseSignOut(firebaseAuth())
}

/** ID token vigente del usuario, renovado por el SDK cuando vence. */
export async function getIdToken(): Promise<string | null> {
  const user = firebaseAuth().currentUser
  return user ? user.getIdToken() : null
}
