import { NavLink, Outlet } from 'react-router'
import { CreditBalance } from '@/account/CreditBalance'
import { useAuth } from '@/account/useAuth'
import { activities } from '@/activities/registry'
import { Button } from '@/ui/Button'

export function AppLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="layout">
      <header className="layout-header">
        <NavLink to="/" className="brand">
          PlaniSimple
        </NavLink>
        <CreditBalance />
        <span className="muted">{user?.email}</span>
        <Button variant="secondary" onClick={() => void signOut()}>
          Salir
        </Button>
      </header>
      <nav className="layout-nav" aria-label="Principal">
        <NavLink to="/" end>
          Mis documentos
        </NavLink>
        {activities.map((entry) => (
          <NavLink key={entry.id} to={`/actividades/${entry.id}`}>
            {entry.title}
          </NavLink>
        ))}
      </nav>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}
