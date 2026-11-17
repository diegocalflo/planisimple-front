import { type FormEvent, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { signInWithEmail, signInWithGoogle } from '@/api/auth'
import { Button } from '@/ui/Button'
import { Field } from '@/ui/Field'
import { Notice } from '@/ui/Notice'
import { useAuth } from './useAuth'

function loginErrorMessage(error: unknown): string | null {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return null
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'El correo o la contraseña no coinciden.'
  }
  if (code === 'auth/too-many-requests') return 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.'
  return 'No pudimos iniciar tu sesión. Inténtalo de nuevo.'
}

export function LoginPage() {
  const { status } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (status === 'ready' || status === 'error') {
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (caught) {
      setError(loginErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void run(() => signInWithEmail(email, password))
  }

  return (
    <main className="centered">
      <h1>PlaniSimple</h1>
      <Button onClick={() => void run(signInWithGoogle)} disabled={busy}>
        Continuar con Google
      </Button>
      <p className="muted">o con tu correo</p>
      <form className="form" onSubmit={submitEmail}>
        <Field label="Correo">
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Contraseña">
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={busy}>
          Ingresar
        </Button>
      </form>
      {error && <Notice tone="error">{error}</Notice>}
    </main>
  )
}
