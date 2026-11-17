import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/account/useAuth'
import { Button } from '@/ui/Button'
import { Notice } from '@/ui/Notice'
import { Spinner } from '@/ui/Spinner'

/** Deja pasar solo con sesión abierta en Firebase y en la API. */
export function RequireAuth() {
  const { status, retry, signOut } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="centered">
        <Spinner label="Abriendo tu sesión" />
      </main>
    )
  }
  if (status === 'signed-out') return <Navigate to="/ingresar" replace state={{ from: location.pathname }} />
  if (status === 'error') {
    return (
      <main className="centered">
        <Notice tone="error">No pudimos abrir tu sesión en PlaniSimple.</Notice>
        <div className="actions">
          <Button onClick={retry}>Reintentar</Button>
          <Button variant="secondary" onClick={() => void signOut()}>
            Salir
          </Button>
        </div>
      </main>
    )
  }
  return <Outlet />
}
