import { useContext } from 'react'
import { AuthContext, type AuthValue } from './authContext'

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return value
}
