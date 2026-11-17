import { createContext } from 'react'
import type { AuthUser } from '@/api/auth'
import type { Session } from '@/api/queries/session'

export interface AuthValue {
  /** `loading` mientras Firebase responde o mientras se abre la sesión en la API. */
  status: 'loading' | 'signed-out' | 'error' | 'ready'
  user: AuthUser | null
  session: Session | undefined
  error: Error | null
  retry: () => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)
