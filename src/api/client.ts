import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from '@/contracts/openapi'
import { getIdToken } from './auth'
import { ApiError } from './errors'

// Cliente tipado desde el OpenAPI del backend (ADR 0004 del backend: `hc`
// queda pendiente porque front y back viven en repositorios distintos).

const withIdToken: Middleware = {
  async onRequest({ request }) {
    const token = await getIdToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
}

export const api = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL })
api.use(withIdToken)

interface FetchResult<T> {
  data?: T
  error?: unknown
  response: Response
}

/** Devuelve `data` o lanza `ApiError` con el error público del backend. */
export function unwrap<T>(result: FetchResult<T>): T {
  if (result.error !== undefined || !result.response.ok) {
    throw new ApiError(result.response.status, result.error)
  }
  return result.data as T
}
