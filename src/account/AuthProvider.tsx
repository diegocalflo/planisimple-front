import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { type AuthUser, onAuthUserChanged, signOut } from '@/api/auth'
import { useSession } from '@/api/queries/session'
import { AuthContext, type AuthValue } from './authContext'

/** Escucha el login de Firebase y abre la sesión en la API (`POST /v1/sesion`) tras cada uno. */
export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined: Firebase aún no responde; null: sin sesión.
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined)
  const queryClient = useQueryClient()
  const session = useSession(user?.uid)

  useEffect(() => onAuthUserChanged(setUser), [])

  const { data, error, refetch } = session
  const value = useMemo<AuthValue>(() => {
    let status: AuthValue['status'] = 'loading'
    if (user === null) status = 'signed-out'
    else if (user && error) status = 'error'
    else if (user && data) status = 'ready'

    return {
      status,
      user: user ?? null,
      session: data,
      error,
      retry: () => void refetch(),
      signOut: async () => {
        await signOut()
        queryClient.clear()
      },
    }
  }, [user, data, error, refetch, queryClient])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
